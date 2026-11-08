import express from 'express'
import pool from "./database/connection.js";
const app = express();
app.use(express.json());

app.get('/db-health', async(req, res) => {
    try {
        const result = await pool.query('SELECT NOW()')
        res.status(200).json({
            status: 'success',
            message: 'Database connected',
            databaseTime: result.rows[0].now,
        })
    }catch (error){
        console.error(error.message)
        res.status(500).json({
            status: 'error',
            message: 'database connection error',

        })
    }

})


app.get('/health',(req,res)=>{
    res.status(200).json({
        status: 'OK',
        message: 'API is running!'
    })
})
app.post('/tasks',async(req,res)=>{
    const {title,description} = req.body;
    if (
        !title ||
        !description ||
        typeof title !== 'string' ||
        !title.trim()
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'missing required fields'
        });
    }
    try {
        const result = await pool.query(
            `INSERT INTO TASKS(title,description) VALUES($1,$2) RETURNING * `,
            [title.trim(),description || null]
        )
res.status(201).json({
    status: 'OK',
    message: 'Task created successfully',
    task: result.rows[0]
})
    }catch (error){
        console.error(error.message)

        res.status(500).json({
            status: 'error',
            message: 'task created failed'
        })
    }
})
app.get('/tasks',async(req,res)=>{
    try {
        const result = await pool.query('SELECT * FROM TASKS');
        res.status(200).json({
            status: 'OK',
            total: result.rowCount,
            tasks: result.rows
        })
    }catch (error){
        console.error('Error Listing task'+error.message)
        res.status(500).json({
            status: 'error',
            message: 'failed to list all tasks'
        })
    }
})

app.get('/tasks/:id',async(req,res)=>{
    const {id} = req.params;
    if (!/^\d+$/.test(id) || Number(id) < 1) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid task ID'
        });
    }
    try {
        const result = await pool.query('SELECT * FROM TASKS WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'Task not found'
            });
        }
        res.status(200).json({
            status: 'OK',
            task: result.rows[0]
        });

    }catch (e) {
        console.error('Error fetching task')
        res.status(500).json({
            status: 'error',
            message: 'failed to fetch task'
        })
    }

})

app.put('/tasks/:id',async(req,res)=>{
    const {id} = req.params;
    const { title, description,completed } = req.body;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid task ID'
        })
    }


    if (
        typeof title !== 'string' ||
        !title.trim() ||
        typeof completed !== 'boolean' ||
        (description !== undefined && description !== null &&
            typeof description !== 'string')
    ) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid task data. Provide title, description and completed.'
        });
    }
    try {
        const result = await pool.query(
            `UPDATE tasks
       SET title = $1,
           description = $2,
           completed = $3
       WHERE id = $4
       RETURNING *`,
            [title.trim(), description ?? null, completed, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'Task not found'
            });
        }

        res.status(200).json({
            status: 'OK',
            message: 'Task updated successfully',
            task: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating task:', error.message);

        res.status(500).json({
            status: 'ERROR',
            message: 'Could not update task'
        });}
})


app.delete('/tasks/:id',async(req,res)=>{
    const {id} = req.params;
    if (!/^\d+$/.test(id) || Number(id) < 1) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid task ID'
        })

    }
    try {
        const result = await pool.query('DELETE FROM TASKS WHERE id = $1 RETURNING *',[id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'Task not found'
            });
        }

        res.status(204).end();
    }catch (e) {
        console.error('Error deleting task:', e);
        res.status(400).json({
            status: 'error',
            message: 'could not delete task'
        })
    }
})
export default app