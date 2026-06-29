import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#64748b',
]

export default function ProjectForm({ open, onClose, onSubmit, initialData, loading }) {
  const isEdit = !!initialData
  const [selectedColor, setSelectedColor] = useState(initialData?.color || COLORS[0])

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name:        initialData?.name || '',
      description: initialData?.description || '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
      })
      setSelectedColor(initialData?.color || '#6366f1')
    }
  }, [open, initialData, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const submit = (data) => {
    onSubmit({ ...data, color: selectedColor })
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Project' : 'New Project'}
    >
      <form onSubmit={handleSubmit(submit)} className="p-6 space-y-4">
        <Input
          label="Project Name"
          required
          placeholder="e.g. E-commerce App"
          error={errors.name?.message}
          {...register('name', { required: 'Project name is required' })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Description <span className="text-neutral-400 dark:text-neutral-500 font-normal">(optional)</span>
          </label>
          <textarea
            className="input-base resize-none"
            rows={3}
            placeholder="What is this project for?"
            {...register('description')}
          />
        </div>

        {/* Color picker */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Accent Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className="w-7 h-7 rounded-full border-2 transition-all duration-100"
                style={{
                  backgroundColor: color,
                  borderColor: selectedColor === color ? color : 'transparent',
                  outline: selectedColor === color ? `2px solid ${color}40` : 'none',
                  outlineOffset: '2px',
                }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
