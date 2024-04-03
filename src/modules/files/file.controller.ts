import { Body, Controller, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeaders, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUserInforGuard } from '../../../src/guards/getUser.guard';
import { JwtAuthenticationGuard } from '../../../src/guards/jwt.guard';
import {
	CheckPasswordDto,
	FileIdDto,
	GetHistoryDto,
	GetPresignedUrl,
	ReferCodeDto,
	SetLinkArrayDto,
} from './dtos/link.req';
import { FileService } from './file.service';

@ApiTags('File')
@Controller({
	path: 'file',
	version: '1',
})
@UseGuards(GetUserInforGuard)
@ApiBearerAuth()
export class FileController {
	constructor(private fileService: FileService) {}

	@Post('set-link')
	@ApiOperation({
		summary: 'Save link to database',
	})
	@ApiHeaders([{ name: 'devideId' }])
	setLink(@Body() body: SetLinkArrayDto, @Req() req, @Headers() headers) {
		const { devideid } = headers;
		return this.fileService.setLink(body, req.user, devideid);
	}

	@Get('get-link')
	@ApiOperation({
		summary: 'Get link to database',
	})
	getLink(@Query() query: FileIdDto, @Req() req) {
		return this.fileService.getLink(query, req.user);
	}

	@Get('presigned-url')
	@ApiOperation({
		summary: 'Get file link',
	})
	@ApiHeaders([{ name: 'devideId' }])
	getPresignedUrl(@Query() query: GetPresignedUrl, @Req() req, @Headers() headers) {
		const { devideid } = headers;
		return this.fileService.getPresignedUrl(query, req.user, devideid);
	}

	@Post('verify-password')
	@ApiOperation({
		summary: 'Verify file password',
	})
	@ApiHeaders([{ name: 'devideId' }])
	verifyPassword(@Body() body: CheckPasswordDto, @Req() req, @Headers() headers: Record<string, string>) {
		const { devideid } = headers;

		return this.fileService.verifyPassword(body, req.user, devideid);
	}

	@Get('history')
	@UseGuards(JwtAuthenticationGuard)
	@ApiOperation({
		summary: 'Get history upload file',
	})
	getHistory(@Query() query: GetHistoryDto, @Req() req) {
		return this.fileService.getHistory(query, req.user);
	}

	@Get('self-download')
	@UseGuards(JwtAuthenticationGuard)
	@ApiOperation({
		summary: 'Get file link',
	})
	selfDownload(@Query() query: FileIdDto, @Req() req) {
		return this.fileService.selfDownload(query, req.user);
	}

	@Post('download')
	@ApiOperation({
		summary: 'Get file link',
	})
	@ApiHeaders([{ name: 'devideId' }])
	download(@Body() body: ReferCodeDto, @Req() req, @Headers() headers) {
		const { devideid } = headers;
		return this.fileService.download(body, req.user, devideid);
	}
}
