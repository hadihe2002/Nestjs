import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('test AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.ceil(Math.random() * 99999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('Creates a new user with hashed and salted password', async () => {
    const user = await service.signup('asdf@asdf.com', 'asdf');
    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('asdf@asdf.com', 'asdf');

    await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toEqual(
      new BadRequestException('this user exist!'),
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(service.singin('asdf@asdf.com', 'password')).rejects.toEqual(
      new NotFoundException('email or password is not correct!'),
    );
  });

  it('should throws an error if an invalid password is provided', async () => {
    await service.signup('asdf@asdf.com', 'password1');

    await expect(service.singin('asdf@asdf.com', 'password')).rejects.toEqual(
      new BadRequestException('bad Request'),
    );
  });

  it('should return a user if correct password is provided', async () => {
    await service.signup('asdf@asdf.com', 'password');

    const user = await service.singin('asdf@asdf.com', 'password');
    expect(user).toBeDefined();
  });
});
