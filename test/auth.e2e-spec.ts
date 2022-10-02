import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getConnection } from 'typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const email = 'test@test.com';
  const password = 'test';

  let req: any;
  let res: request.Response;
  let cookie: string[];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    req = request(app.getHttpServer());
  });

  afterEach(async () => {
    const entities = getConnection().entityMetadatas;

    for (const entity of entities) {
      const repository = getConnection().getRepository(entity.name);
      await repository.clear();
    }

    await getConnection().close();
  });

  test('auth/signup works', () => {
    return req
      .post('/auth/signup')
      .send({ email: 'test@test.com', password: 'test' })
      .expect(201);
  });

  test('auth/whoami and Serializer work', async () => {
    res = await req
      .post('/auth/signup')
      .send({ email, password: 'test' })
      .expect(201);

    cookie = res.get('Set-Cookie');

    const { body } = await req
      .get('/auth/whoami')
      .set('Cookie', cookie)
      .expect(200);

    expect(body.email).toEqual(email);

    // * Interceptor Serialize Works
    expect(body.password).toBeFalsy();
  });

  test('auth/signin works', async () => {
    res = await req.post('/auth/signup').send({ email, password }).expect(201);

    cookie = res.get('Set-Cookie');

    res = await req.post('/auth/signout').set('Cookie', cookie).expect(201);

    cookie = res.get('Set-Cookie');

    const { body } = await req
      .post('/auth/signin')
      .set('Cookie', cookie)
      .send({ email, password })
      .expect(201);

    expect(body.email).toEqual(email);
    expect(body.password).toBeFalsy();
  });

  test('Update Gaurd Works', async () => {
    res = await req.post('/auth/signup').send({ email, password }).expect(201);
    const id = res.body.id;

    cookie = res.get('Set-Cookie');

    res = await req.post('/auth/signout').set('Cookie', cookie).expect(201);

    cookie = res.get('Set-Cookie');

    try {
      await req
        .patch(`auth/${id}`)
        .set('Cookie', cookie)
        .send({ password: 'te' })
        .expect(400);
    } catch (err) {
      expect(err.message).toContain('ECONNREFUSED');
    }
  });

  test('Update works for changing password when authenticated', async () => {
    await req.post('/auth/signup').send({ email, password }).expect(201);

    res = await req
      .post('/auth/signup')
      .send({ email: 'hadihe2002@gmail.com', password: 'HH' })
      .expect(201);
    const id = res.body.id;

    res = await req.post('/auth/signin').send({ email, password }).expect(201);

    cookie = res.get('Set-Cookie');

    res = await req
      .patch(`/auth/${id}`)
      .set('Cookie', cookie)
      .send({ password: 'H' });

    const { body } = await req
      .post('/auth/signin')
      .send({ email: 'hadihe2002@gmail.com', password: 'H' })
      .expect(201);

    expect(body.email).toEqual('hadihe2002@gmail.com');
    expect(body.id).toEqual(id);
  });

  test('findById and findByEmail works', async () => {
    res = await req.post('/auth/signup').send({ email, password }).expect(201);
    const id = res.body.id;

    res = await req.get(`/auth/${id}`).expect(200);
    expect(res.body.email).toEqual(email);
    expect(res.body.id).toEqual(id);

    res = await req.get(`/auth?email=${email}`).expect(200);

    expect(res.body[0].id).toEqual(id);
    expect(res.body[0].email).toEqual(email);
  });

  test('delete works properly', async () => {
    res = await req.post('/auth/signup').send({ email, password });
    const id = res.body.id;
    res = await req.delete(`/auth/${id}`).expect(200);

    try {
      await req.post('/auth/signin').send({ email, password }).expect(404);
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.message).toEqual('email or password is not correct!');
    }
  });
});
