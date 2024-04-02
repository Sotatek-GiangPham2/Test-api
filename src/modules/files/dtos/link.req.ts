import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SetLinkDto {
	@ApiProperty({ example: 'a11f28b9-img-test.png' })
	@IsString()
	@IsNotEmpty()
	@Expose()
	filename: string;

	@ApiProperty({ example: 1111 })
	@Type(() => Number)
	@IsNotEmpty()
	@Expose()
	filesize: number;

	@ApiPropertyOptional({ example: 'Abcd@1234' })
	@IsString()
	@IsOptional()
	@Expose()
	password: string;
}

export class SetLinkArrayDto {
	@Expose()
	@ApiProperty({
		type: [SetLinkDto],
	})
	@Type(() => SetLinkDto)
	@ValidateNested()
	data: SetLinkDto[];
}

export class CheckPasswordDto {
	@ApiProperty({ example: 'Abcd@1234' })
	@IsString()
	@IsOptional()
	@Expose()
	password: string;

	@ApiProperty({ example: '12' })
	@Type(() => Number)
	@IsOptional()
	@Expose()
	fileId: number;

	@ApiProperty({ example: 'anbddd' })
	@IsOptional()
	@Expose()
	referCode: string;
}

@Expose()
export class GetHistoryDto {
	@Expose()
	@ApiPropertyOptional()
	@Transform(({ value }: { value: string }) => {
		if (!value || +value <= 0) return 10;
		else return +value;
	})
	@IsOptional()
	limit = 10;

	@Expose()
	@ApiPropertyOptional()
	@Transform(({ value }: { value: string }) => {
		if (!value || +value <= 0) return 1;
		else return +value;
	})
	@IsOptional()
	page = 1;
}

@Expose()
export class GetPresignedUrl {
	@ApiProperty({ example: 12 })
	@Type(() => Number)
	@IsOptional()
	@Expose()
	fileId: number;

	@ApiProperty({ example: 'anbddd' })
	@IsOptional()
	@Expose()
	referCode: string;
}

@Expose()
export class FileIdDto {
	@ApiProperty({ example: 12 })
	@Type(() => Number)
	@IsOptional()
	@Expose()
	fileId: number;
}

@Expose()
export class ReferCodeDto {
	@ApiProperty({ example: 12 })
	@Type(() => Number)
	@IsOptional()
	@Expose()
	fileId: number;

	@ApiProperty({ example: 'anbddd' })
	@IsOptional()
	@Expose()
	referCode: string;
}
