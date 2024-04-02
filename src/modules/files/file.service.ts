import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import moment from 'moment';
import { EError, USER_ACTION, USER_POINT } from 'src/helpers/constant';
import { httpBadRequest } from 'src/helpers/exceptions';
import { generateHash, validateHash } from 'src/helpers/hash-string';
import s3Client from 'src/helpers/s3';
import supabaseClient from 'src/helpers/supabase';
import {
	CheckPasswordDto,
	FileIdDto,
	GetHistoryDto,
	GetPresignedUrl,
	ReferCodeDto,
	SetLinkArrayDto,
} from './dtos/link.req';

@Injectable()
export class FileService {
	constructor(private configService: ConfigService) {}
	async setLink(body: SetLinkArrayDto, user, ip: string) {
		const requestBody = body.data;
		const dataResponse = [];
		await Promise.all(
			requestBody.map(async (item) => {
				const { data } = await supabaseClient
					.from('files')
					.insert({
						password: item.password ? await generateHash(item.password) : null,
						user_id: user?.id ?? null,
						filename: item.filename,
						size: item.filesize,
						expired_at: moment().add(3, 'd'),
						points: USER_POINT.UPLOAD_FILE,
						ip,
					})
					.select();

				dataResponse.push({
					id: data[0].id,
					user_id: data[0].user_id,
					filename: data[0].filename,
					password: item.password ? true : false,
				});
			}),
		);

		// add point for owner
		if (user.id) {
			await this.PlusPointById(user.id, USER_POINT.UPLOAD_FILE * requestBody.length);
		}

		return {
			message: 'success',
			data: dataResponse,
		};
	}

	async getLink(body: FileIdDto, user) {
		const referCode = user?.refer_code ? user.refer_code : '';

		return {
			url: this.configService.get<string>('FE_STORAGE_URL') + '/shared/' + body.fileId + '?code=' + referCode,
		};
	}

	async getHistory(queries: GetHistoryDto, user) {
		const start = (queries.page - 1) * queries.limit;
		const { data } = await supabaseClient
			.from('files')
			.select('*', { count: 'exact' })
			.eq('user_id', user.id)
			.range(start, start + queries.limit - 1)
			.order('id', { ascending: false });

		const count = await supabaseClient.from('files').select('*', { count: 'exact' }).eq('user_id', user.id);

		return {
			data: data ?? [],
			total: count.count ?? 0,
			page: queries.page,
			limit: queries.limit,
		};
	}

	async getPresignedUrl(data: GetPresignedUrl, user, ip: string) {
		const file = (await supabaseClient.from('files').select().eq('id', data.fileId).single()).data;

		if (file == null) {
			httpBadRequest(EError.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
		}
		if (file.expired_at < new Date().toISOString()) {
			httpBadRequest(EError.FILE_EXPIRED, 'FILE_EXPIRED');
		}

		if (file.password) {
			httpBadRequest(EError.FILE_REQUIRED_PASSWORD, 'FILE_REQUIRED_PASSWORD');
		}

		await this.addPoint(
			file,
			ip,
			USER_ACTION.VIEW,
			user.id,
			USER_POINT.VIEWER_VIEW_FILE,
			data.referCode,
			USER_POINT.ACCESS_VIEW_FILE,
			file.user_id,
			USER_POINT.OWNER_VIEW_FILE,
		);
		const dataS3 = await this.getPresignUrlFromS3(file, true);
		return { url: dataS3 };
	}

	async verifyPassword(data: CheckPasswordDto, user, ip: string) {
		const file = (await supabaseClient.from('files').select().eq('id', data.fileId).single()).data;

		if (file == null) {
			httpBadRequest(EError.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
		}

		if (!file.password) {
			httpBadRequest(EError.FILE_NOT_HAVE_PASSWORD, 'FILE_NOT_HAVE_PASSWORD');
		}

		if (file.expired_at < new Date().toISOString()) {
			httpBadRequest(EError.FILE_EXPIRED, 'FILE_EXPIRED');
		}

		const checkPassword = await validateHash(data.password, file.password);

		if (!checkPassword) httpBadRequest(EError.WRONG_PASSWORD, 'WRONG_PASSWORD');

		const dataS3 = await this.getPresignUrlFromS3(file, true);
		await this.addPoint(
			file,
			ip,
			USER_ACTION.VIEW,
			user.id,
			USER_POINT.VIEWER_VIEW_FILE,
			data.referCode,
			USER_POINT.ACCESS_VIEW_FILE,
			file.user_id,
			USER_POINT.OWNER_VIEW_FILE,
		);

		return { url: dataS3 };
	}

	private async getPresignUrlFromS3(file: any, updateExpDate?: boolean) {
		const expiresIn = 86400; // 24 hours

		// update expired date
		// point: file.point + filePoint
		if (updateExpDate) {
			await supabaseClient
				.from('files')
				.update({ expired_at: moment().add(3, 'd') })
				.eq('id', file.id);
		}

		return await getSignedUrl(
			s3Client,
			new GetObjectCommand({
				Bucket: process.env.NEXT_PUBLIC_STORE_BUCKET,
				Key: file.filename,
			}),
			{ expiresIn: expiresIn },
		);
	}

	async selfDownload(query: FileIdDto, user) {
		const file = (await supabaseClient.from('files').select().eq('id', query.fileId).single()).data;

		if (file == null) {
			httpBadRequest(EError.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
		}

		if (user.id != file.user_id) {
			httpBadRequest(EError.NO_PERMISSION_TO_DOWNLOAD_THIS_FILE, 'NO_PERMISSION_TO_DOWNLOAD_THIS_FILE');
		}
		const url = await this.getPresignUrlFromS3(file, false);
		return { url };
	}

	private async PlusPointById(userId: number, point: number) {
		const { data: currentUser } = await supabaseClient.from('users').select().eq('id', userId).single();
		const newPoint = currentUser.points + point;

		return supabaseClient.from('users').update({ points: newPoint }).eq('id', userId);
	}

	private async PlusPointByReferCode(referCode: string, point: number, ownerId: number) {
		const { data: currentUser } = await supabaseClient.from('users').select().eq('refer_code', referCode).single();

		if (currentUser == null) {
			return;
		}

		if (currentUser.id == ownerId) return;
		await supabaseClient
			.from('users')
			.update({ points: `${Number(currentUser.points) + point}` })
			.eq('id', currentUser.id);
	}

	private async addPoint(
		file: any,
		ip: string,
		action: string,
		viewer_id?: number,
		viewerPoint?: number,
		referCode?: string,
		accessPoint?: number,
		owner_id?: number,
		ownerPoint?: number,
	) {
		const query = supabaseClient.from('user_file').select().eq('action', action).eq('filename', file.filename);
		if (viewer_id) {
			query.eq('user_id', viewer_id);
		} else {
			query.eq('ip', ip).is('user_id', null);
		}

		const { data: checkAddPoint } = await query.single();

		// check viewer != uploader
		let checkViewer;

		if (viewer_id || file.user_id) {
			checkViewer = viewer_id != file.user_id ? true : false;
		} else {
			checkViewer = file.ip != ip ? true : false;
		}

		// return checkAddPoint;
		if (viewer_id && referCode != '') {
			const { data: user } = await supabaseClient.from('users').select().eq('id', viewer_id).single();

			if (user.refer_code == referCode) {
				return;
			}
		}

		if (checkViewer) {
			if (checkAddPoint == null) {
				await supabaseClient.from('user_file').insert({
					filename: file.filename,
					action,
					ip: ip ?? null,
					user_id: viewer_id ?? null,
					refer_code: [referCode],
				});
				// Add point for viewer file
				if (viewer_id && checkViewer) {
					await this.PlusPointById(viewer_id, viewerPoint);
				}

				// Add point for referUser
				if (referCode && referCode != '') {
					await this.PlusPointByReferCode(referCode, accessPoint, owner_id);
				}
				// Add point for owner
				if (owner_id && checkViewer) {
					await this.PlusPointById(owner_id, ownerPoint);
				}
				await supabaseClient
					.from('files')
					.update({
						points: file.points + ownerPoint,
						views: action == USER_ACTION.VIEW ? file.views + 1 : file.views,
						downloads: action == USER_ACTION.DOWNLOAD ? file.downloads + 1 : file.downloads,
					})
					.eq('id', file.id);
			} else {
				if (!checkAddPoint.refer_code.includes(referCode)) {
					// Add point for referUser
					if (referCode && referCode != '') {
						await this.PlusPointByReferCode(referCode, accessPoint, owner_id);
					}
					// Add point for owner
					if (owner_id && checkViewer) {
						await this.PlusPointById(owner_id, ownerPoint);
					}
					const arr = checkAddPoint.refer_code;
					arr.push(referCode);

					await supabaseClient
						.from('files')
						.update({
							points: file.points + ownerPoint,
							views: action == USER_ACTION.VIEW ? file.views + 1 : file.views,
							downloads: action == USER_ACTION.DOWNLOAD ? file.downloads + 1 : file.downloads,
						})
						.eq('id', file.id);

					await supabaseClient
						.from('user_file')
						.update({
							refer_code: arr,
						})
						.eq('id', checkAddPoint.id);
				}
			}
		}

		return '';
	}

	async download(body: ReferCodeDto, user: any, ip: string) {
		const file = (await supabaseClient.from('files').select().eq('id', body.fileId).single()).data;

		if (file == null) {
			httpBadRequest(EError.FILE_NOT_FOUND, 'FILE_NOT_FOUND');
		}

		if (file.expired_at < new Date().toISOString()) {
			httpBadRequest(EError.FILE_EXPIRED, 'FILE_EXPIRED');
		}

		const url = await this.getPresignUrlFromS3(file, false);
		if (file.user_id == user?.id) {
			return { url };
		}

		await this.addPoint(
			file,
			ip,
			USER_ACTION.DOWNLOAD,
			user.id,
			USER_POINT.VIEWER_DOWNLOAD_FILE,
			body.referCode,
			0,
			file.user_id,
			USER_POINT.OWNER_DOWNLOAD_FILE,
		);

		return { url };
	}
}
