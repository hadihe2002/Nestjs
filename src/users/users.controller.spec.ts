import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import UsersController from './users.controller';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUserService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUserService = {
      findOne: jest.fn((id: number) =>
        Promise.resolve({
          id,
          email: 'asdf@asdf.com',
          password: 'asdf',
        } as User),
      ),

      find: jest.fn((email: string) =>
        Promise.resolve([{ id: 1, email, password: 'asdf' }] as User[]),
      ),

      remove: jest.fn((id: number) =>
        Promise.resolve({
          id,
          email: 'test@test.com',
          password: 'test',
        } as User),
      ),

      update: jest.fn((id: number, attrs) =>
        Promise.resolve({
          id,
          email: attrs.email,
          password: attrs.password,
        } as User),
      ),
    };
    fakeAuthService = {
      signup: jest.fn((email: string, password: string) => {
        return Promise.resolve({ id: 1, email, password } as User);
      }),
      singin: jest.fn((email: string, password: string) => {
        return Promise.resolve({ id: 1, email, password } as User);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUserService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  test('@GET findAllUsers', async () => {
    const email = 'asdf@asdf.com';
    const users = await controller.findAllUsers(email);
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual(email);
    expect(fakeUserService.find).toBeCalled();
  });

  test('@GET findUser', async () => {
    const user = await controller.findUser(1);
    expect(user.id).toBe(1);
    expect(user.email).toBe('asdf@asdf.com');
    expect(user.password).toBe('asdf');
    expect(fakeUserService.findOne).toBeCalled();
  });

  it('should throws an error if user not found', async () => {
    fakeUserService.findOne = () => null;
    await expect(controller.findUser(1)).rejects.toEqual(
      new NotFoundException('user not found'),
    );
  });

  test('@POST signin', async () => {
    const session = { userId: -10000 };
    const user = await controller.signInUser(
      {
        email: 'asdf@asdf.com',
        password: 'asdf',
      },
      session,
    );

    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
    expect(fakeAuthService.singin).toBeCalled();
  });

  test('@GET whoAmI', () => {
    const user = { email: 'test@test.com', password: 'test' } as User;
    expect(controller.whoAmI(user)).toEqual(user);
  });

  it('should throw an error when null value is provided', async () => {
    const user = {} as User;
    try {
      controller.whoAmI(user);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
    }
  });

  test('@POST signout', () => {
    const session = { userId: 1 };
    controller.singOut(session);
    expect(session.userId).toEqual(null);
  });

  test('@POST signup', async () => {
    const session = { userId: null };
    const user = await controller.createUser(
      {
        email: 'test@test.com',
        password: 'test',
      },
      session,
    );
    expect(user.email).toEqual('test@test.com');
    expect(session.userId).toEqual(user.id);
    expect(fakeAuthService.signup).toBeCalled();
  });

  test('@PATCH updateUser', async () => {
    const user = await controller.updateUser(1, {
      email: 'test@test.com',
      password: 'test',
    });
    expect(user.id).toEqual(1);
    expect(user.email).toEqual('test@test.com');
    expect(user.password).toEqual('test');
    expect(fakeUserService.update).toBeCalled();
  });

  test('@DELETE removeUser', async () => {
    const user = await controller.removeUser(1);
    expect(user.email).toEqual('test@test.com');
    expect(user.password).toEqual('test');
    expect(user.id).toBe(1);
    expect(fakeUserService.remove).toBeCalled();
  });
});
