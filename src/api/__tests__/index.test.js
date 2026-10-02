const request = require('supertest');
const db = require('../db');

jest.mock('../db');

const app = require('../index');

describe('Task API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', completed: false, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, title: 'Task 2', completed: true, created_at: '2024-01-02T00:00:00Z' },
      ];
      db.query.mockResolvedValue({ rows: mockTasks });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockTasks);
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM tasks ORDER BY created_at ASC');
    });

    it('should return empty array when no tasks', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const newTask = { id: 1, title: 'New Task', completed: false, created_at: '2024-01-01T00:00:00Z' };
      db.query.mockResolvedValue({ rows: [newTask] });

      const res = await request(app)
        .post('/tasks')
        .send({ title: 'New Task' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(newTask);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
        ['New Task']
      );
    });

    it('should reject when title is missing', async () => {
      const res = await request(app).post('/tasks').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'title is required' });
    });

    it('should reject when title is empty string', async () => {
      const res = await request(app).post('/tasks').send({ title: '   ' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'title is required' });
    });

    it('should trim whitespace from title', async () => {
      const newTask = { id: 1, title: 'Task', completed: false, created_at: '2024-01-01T00:00:00Z' };
      db.query.mockResolvedValue({ rows: [newTask] });

      await request(app)
        .post('/tasks')
        .send({ title: '  Task  ' });

      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
        ['Task']
      );
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update task completed status', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Task', completed: false }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Task', completed: true }] });

      const res = await request(app)
        .patch('/tasks/1')
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, title: 'Task', completed: true });
    });

    it('should return 404 when task not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .patch('/tasks/999')
        .send({ completed: true });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not found' });
    });

    it('should update task title', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Old Title', completed: false }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'New Title', completed: false }] });

      const res = await request(app)
        .patch('/tasks/1')
        .send({ title: 'New Title' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1, title: 'New Title', completed: false });
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete an existing task and return 204', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const res = await request(app).delete('/tasks/1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(db.query).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = $1 RETURNING id', [1]);
    });

    it('should return 404 when task does not exist', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = await request(app).delete('/tasks/999');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not found' });
      expect(db.query).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = $1 RETURNING id', [999]);
    });

    it('should parse id as integer', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 42 }] });

      await request(app).delete('/tasks/42');

      expect(db.query).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = $1 RETURNING id', [42]);
    });

    it('should handle string ids correctly', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 5 }] });

      await request(app).delete('/tasks/5');

      expect(db.query).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = $1 RETURNING id', [5]);
    });
  });

  describe('GET /tasks - after deletion', () => {
    it('should not include deleted tasks', async () => {
      const remainingTasks = [
        { id: 2, title: 'Task 2', completed: false, created_at: '2024-01-02T00:00:00Z' },
      ];
      db.query.mockResolvedValue({ rows: remainingTasks });

      const res = await request(app).get('/tasks');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(remainingTasks);
      expect(res.body.length).toBe(1);
    });
  });
});
