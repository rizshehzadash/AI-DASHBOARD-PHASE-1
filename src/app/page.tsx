'use client'

import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type Task = {
  id: string
  title: string
  priority: number
  status: string
}

export default function HomePage() {
  // -------------------------
  // TASK STATE (UNCHANGED)
  // -------------------------
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState(1)

  // -------------------------
  // LOAD TASKS
  // -------------------------
  const loadTasks = useCallback(async () => {
    if (!supabase) {
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured; skipping task load.')
      }
      return
    }
    const { data } = await supabase.from('tasks').select('*').order('priority')
    setTasks(data || [])
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // -------------------------
  // CREATE TASK
  // -------------------------
  async function addTask() {
    if (!title) return

    if (!supabase) {
      console.warn('Supabase is not configured; cannot add task.')
      return
    }
    await supabase.from('tasks').insert({
      title,
      priority,
      status: 'todo',
    })

    setTitle('')
    setPriority(1)
    loadTasks()
  }

  // -------------------------
  // DELETE TASK
  // -------------------------
  async function deleteTask(id: string) {
    if (!supabase) {
      console.warn('Supabase is not configured; cannot delete task.')
      return
    }
    await supabase.from('tasks').delete().eq('id', id)
    loadTasks()
  }

  // -------------------------
  // TOGGLE TASK STATUS
  // -------------------------
  async function toggleStatus(task: Task) {
    if (!supabase) {
      console.warn('Supabase is not configured; cannot update task.')
      return
    }
    const next =
      task.status === 'todo'
        ? 'in-progress'
        : task.status === 'in-progress'
        ? 'done'
        : 'todo'

    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    loadTasks()
  }

  return (
    <div className="p-6 space-y-10">
      {/* ---------------- TASKS ---------------- */}
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">AI Dashboard</h1>

        <div className="border rounded p-4 space-y-2">
          <input
            className="w-full p-2 rounded bg-black border"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="number"
            className="w-full p-2 rounded bg-black border"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
          <button
            onClick={addTask}
            className="px-4 py-2 border rounded"
          >
            Add Task
          </button>
        </div>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded p-3 flex justify-between items-center"
            >
              <div>
                <div>{task.title}</div>
                <div className="text-sm text-slate-400">
                  Priority: {task.priority}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(task)}
                  className="px-2 py-1 border rounded"
                >
                  {task.status}
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="px-2 py-1 border border-red-500 text-red-400 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}