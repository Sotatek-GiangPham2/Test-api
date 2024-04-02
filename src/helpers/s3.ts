import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
	endpoint: process.env.NEXT_PUBLIC_STORE_ENDPOINT,
	region: process.env.NEXT_PUBLIC_STORE_REGION,
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.NEXT_PUBLIC_STORE_ACCESS_KEY_ID as string,
		secretAccessKey: process.env.NEXT_PUBLIC_STORE_SECRET_ACCESS_KEY as string,
	},
});
export default s3Client;
