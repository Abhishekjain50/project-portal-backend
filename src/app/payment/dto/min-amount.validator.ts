import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function MinAmountForCurrency(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'minAmountForCurrency',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const currency = (obj.currency || 'aed').toLowerCase();
          
          // Currency-specific minimum amounts
          const minimums: { [key: string]: number } = {
            'aed': 2,
            'usd': 0.50,
            'eur': 0.50,
            'gbp': 0.30,
            'jpy': 50,
            'cad': 0.50,
            'aud': 0.50,
          };
          
          const minimum = minimums[currency] || 0.01;
          
          if (typeof value !== 'number') {
            return false;
          }
          
          return value >= minimum;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as any;
          const currency = (obj.currency || 'aed').toLowerCase();
          
          const minimums: { [key: string]: number } = {
            'aed': 2,
            'usd': 0.50,
            'eur': 0.50,
            'gbp': 0.30,
            'jpy': 50,
            'cad': 0.50,
            'aud': 0.50,
          };
          
          const minimum = minimums[currency] || 0.01;
          const currencyUpper = currency.toUpperCase();
          
          return `Amount must be at least ${minimum} ${currencyUpper}`;
        },
      },
    });
  };
}

