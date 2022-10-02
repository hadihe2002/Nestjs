import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { User } from './users.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repo;
  let users: User[];
  const id = 1;
  const email = 'test@test.com';
  const password = 'test';
  const testUser = { id, email, password };

  beforeEach(async () => {
    users = [];
    repo = {
      create(email: string, password: string) {
        return testUser as User;
      },
      save(user: User) {
        users.push(user);
        return Promise.resolve(user);
      },
      findOne(id: number) {
        return Promise.resolve(testUser as User);
      },
      find(email: string) {
        return Promise.resolve([testUser] as User[]);
      },
      remove(id: number) {
        return Promise.resolve(testUser as User);
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('', () => {
    expect(1).toBe(1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('create method', async () => {
    const user = await service.create(email, password);
    expect(user).toEqual(testUser);
    expect(users).toEqual([testUser]);
  });

  test('findOne method', async () => {
    const user = await service.findOne(1);
    expect(user).toEqual(testUser);
  });

  it('  should return null error if id is not provided', () => {
    expect(service.findOne(null)).toBeFalsy();
  });

  test('find method', async () => {
    const allUsers = await service.find('test@test.com');
    expect(allUsers).toEqual([testUser]);
  });

  test('update method', async () => {
    const user = await service.update(1, { email: 'hadi@hadi.com' });
    expect(user.email).toBe('hadi@hadi.com');
  });

  it('  should throw an error if user is not found', async () => {
    repo.findOne = () => Promise.resolve(null);
    try {
      await service.update(1, {});
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
    }
  });

  test('remove method', async () => {
    const user = await service.remove(1);
    expect(user).toEqual(testUser);
  });

  it('  should throw an error if user is not found', async () => {
    repo.findOne = () => Promise.resolve(null);
    try {
      await service.remove(1);
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
    }
  });
});
