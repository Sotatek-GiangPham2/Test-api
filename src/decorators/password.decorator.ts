import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsPassword(regexp: string, length?: number, validationOptions?: ValidationOptions) {
	return (object: any, propertyName: string) => {
		registerDecorator({
			name: 'password',
			target: object.constructor,
			propertyName: propertyName,
			validator: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				validate(value: any, _validationArguments?: ValidationArguments) {
					let isValidation = true;
					const password = String(value);
					const regex = new RegExp(regexp);
					if (!regex.test(password)) {
						isValidation = false;
					}
					if (length && password.length < length) {
						isValidation = false;
					}
					return isValidation;
				},
			},
			options: validationOptions,
			constraints: [regexp, length],
		});
	};
}
