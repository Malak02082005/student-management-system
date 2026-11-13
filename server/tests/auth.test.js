const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { startDb, stopDb, clearDb, createWorker } = require('./helpers');
const app = require('../app');

before(startDb);
after(stopDb);
beforeEach(clearDb);

describe('GET /api/health', () => {
  it('responds without logging in', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });
});

describe('POST /api/auth/login', () => {
  it('requires email and password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'worker@school.edu' });
    assert.equal(res.status, 400);
  });

  it('logs in with the right password and never returns the password hash', async () => {
    const { password } = await createWorker();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '  WORKER@school.edu ', password }); // case and spaces are ignored

    assert.equal(res.status, 200);
    assert.equal(typeof res.body.token, 'string');
    assert.equal(res.body.user.email, 'worker@school.edu');
    assert.equal(res.body.user.password, undefined);
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await createWorker();
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'worker@school.edu', password: 'not-the-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@school.edu', password: 'password123' });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.message, unknownEmail.body.message);
  });
});

describe('Protected routes', () => {
  it('GET /api/auth/me returns the logged-in worker', async () => {
    const { token } = await createWorker({ name: 'Mary Ann Smith' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Mary Ann Smith');
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/students');
    assert.equal(res.status, 401);
  });

  it('rejects an invalid or expired token', async () => {
    const { user } = await createWorker();
    const expired = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: -10 });

    for (const token of ['not-a-real-token', expired]) {
      const res = await request(app).get('/api/students').set('Authorization', `Bearer ${token}`);
      assert.equal(res.status, 401);
    }
  });

  it('rejects the token of a deleted account', async () => {
    const { user, token } = await createWorker();
    await user.deleteOne();
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 401);
  });
});
