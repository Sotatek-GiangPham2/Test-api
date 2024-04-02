import { compare, hash } from 'bcrypt';

export const generateHash = (password: string) => {
	return hash(password, Number(process.env.BCRYPT_SALT_ROUND));
};

export const validateHash = (value: string, hash: string) => compare(value, hash);

export const getUsername = (email: string) => {
	const parts = email.split('@');

	return parts[0];
};
