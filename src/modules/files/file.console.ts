import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import supabaseClient from '../../../src/helpers/supabase';
import { S3 } from 'aws-sdk';
import { sleep } from '../../../src/helpers/common';
import moment from 'moment';

@Console()
@Injectable()
export class FileConsole {
	private readonly s3: S3;

	constructor() {
		this.s3 = new S3({
			endpoint: process.env.NEXT_PUBLIC_STORE_ENDPOINT,
			s3ForcePathStyle: true,
			region: process.env.NEXT_PUBLIC_STORE_REGION,
			credentials: {
				accessKeyId: process.env.NEXT_PUBLIC_STORE_ACCESS_KEY_ID,
				secretAccessKey: process.env.NEXT_PUBLIC_STORE_SECRET_ACCESS_KEY,
			},
		});
	}

	@Command({
		command: 'expire-date-file',
		description: 'Handle expirate file',
	})
	async getExpirateFile(): Promise<void> {
		while (true) {
			const date = new Date().toISOString();
			const { data: getData } = await supabaseClient
				.from('files')
				.select()
				.lt('expired_at', date)
				.is('status', null);

			const ids = [];
			const filenames = [];

			if (getData != null) {
				console.log('start job: delete file getData length', getData.length);
				for (let index = 0; index < getData.length; index++) {
					const item = getData[index];
					filenames.push({ Key: item.filename });
					ids.push(item.id);
				}
			}
			await supabaseClient.from('files').update({ status: 'expired' }).in('id', ids);

			const params: S3.DeleteObjectsRequest = {
				Bucket: process.env.NEXT_PUBLIC_STORE_BUCKET,
				Delete: {
					Objects: filenames,
				},
			};

			try {
				await this.s3.deleteObjects(params).promise();
			} catch (error) {
				console.error('Error deleting files:', error);
			}
			console.log('end job delete file at: ', moment());
			await sleep(300000);
		}
	}
}
