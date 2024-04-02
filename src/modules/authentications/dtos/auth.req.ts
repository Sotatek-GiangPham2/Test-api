import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsPassword } from 'src/decorators/password.decorator';
import { REGEX_PASSWORD } from 'src/helpers/constant';

export class LoginGoogleDto {
	@ApiProperty({ example: '4/0AfJohXkgOVdwSMIbEvD9AjKvn3c8T6GYFHMnfnIiD9F_XYxo71pUDPYjCRbZnzQYtcvZ4g' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	token: string;
}
@Exclude()
export class SignupDto {
	@ApiProperty({ example: 'new-account@gmail.com' })
	@IsEmail()
	@IsNotEmpty()
	@Expose()
	email: string;

	@ApiProperty({ example: 'Abcd@1234' })
	@IsString()
	@IsNotEmpty()
	@IsPassword(REGEX_PASSWORD, 8, {
		message: 'Please enter at least 8 characters, including letters, numbers and special characters.',
	})
	@Expose()
	password: string;
}

@Exclude()
export class LoginDto {
	@ApiProperty({ example: 'new-account@gmail.com' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	email: string;

	@ApiProperty({ example: 'Abcd@1234' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	password: string;
}

export class ForgotPasswordDto {
	@ApiProperty({ example: 'new-account@gmail.com' })
	@IsEmail()
	@IsNotEmpty()
	@Expose()
	email: string;
}

export class checkTokenDto {
	@ApiProperty({ example: 'YSHAbRdHIoR3MmoAchqwzFKprJ' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	token: string;
}

@Exclude()
export class ResetPasswordDto {
	@ApiProperty({ example: 'YSHAbRdHIoR3MmoAchqwzFKprJ' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	token: string;

	@ApiProperty({ example: 'Abcd@12345' })
	@IsNotEmpty()
	@Expose()
	password: string;
}
