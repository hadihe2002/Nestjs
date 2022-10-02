import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Hash, randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // See if email exist
    const doesItExist = await this.usersService.find(email);
    if (doesItExist.length) {
      throw new BadRequestException('this user exist!');
    }

    // Hash the users password
    //Generate a salt
    const salt = randomBytes(8).toString('hex');
    // hash the slat and password
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');
    // Create a new user
    const user = await this.usersService.create(email, result);

    //return user
    return user;
  }

  async singin(email: string, password: string) {
    const [user] = await this.usersService.find(email);

    if (!user) {
      throw new NotFoundException('email or password is not correct!');
    }

    const orgPassword = user.password;

    const salt = user.password.split('.')[0];
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');

    if (orgPassword !== result) {
      throw new BadRequestException('bad Request');
    }
    return user;
  }
}
