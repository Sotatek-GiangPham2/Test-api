import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthenticationGuard } from 'src/guards/jwt.guard';
import { AuthService } from './auth.service';
import {
	checkTokenDto,
	ForgotPasswordDto,
	LoginDto,
	LoginGoogleDto,
	ResetPasswordDto,
	SignupDto,
} from './dtos/auth.req';

@ApiTags('Authentication')
@Controller({
	path: 'auth',
	version: '1',
})
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('login/google')
	@ApiOperation({
		description:
			'Using https://codesandbox.io/p/sandbox/loving-panka-gl85ff?file=%2Fsrc%2FApp.js%3A36%2C1 to get token',
		summary: 'Request presigned url to login',
	})
	googleAuthVerify(@Body() body: LoginGoogleDto) {
		return this.authService.loginGoogle(body);
	}

	@Post('register')
	@ApiOperation({
		summary: 'Register flostream account.',
	})
	register(@Body() body: SignupDto) {
		return this.authService.register(body);
	}

	@Post('login')
	@ApiOperation({
		summary: 'Login via email/password',
	})
	login(@Body() body: LoginDto) {
		return this.authService.login(body);
	}

	@Post('logout')
	@ApiOperation({
		summary: 'Logout',
	})
	@UseGuards(JwtAuthenticationGuard)
	async logout(@Req() request): Promise<any> {
		return this.authService.logout(request.user.id);
	}

	@Post('request-forgot-password')
	@ApiOperation({
		summary: 'Request sent mail to reset password',
	})
	forgotPassword(@Body() body: ForgotPasswordDto): Promise<any> {
		return this.authService.forgotPassword(body);
	}

	@Get('check-reset-password')
	@ApiOperation({
		summary: 'Check token reset password!',
	})
	checkToken(@Query() query: checkTokenDto): Promise<any> {
		return this.authService.checkToken(query);
	}

	@Post('reset-password')
	@ApiOperation({
		summary: 'Reset password',
	})
	async resetPassword(@Body() body: ResetPasswordDto): Promise<any> {
		return await this.authService.resetPassword(body);
	}

	@UseGuards(JwtAuthenticationGuard)
	@Get('user-infor')
	@ApiOperation({
		summary: 'Get user infor',
	})
	async getUserInfor(@Req() req): Promise<any> {
		return await this.authService.getUserInfor(req.user);
	}
}
