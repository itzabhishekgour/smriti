import ProjectCard from './ProjectCard'
import { SkeletonCard } from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import { FolderOpen, FolderDown } from 'lucide-react'
import Button from '../ui/Button'

export default function ProjectGrid({ projects, loading, onNew, onEdit, onDelete, onExport, onImportGithub }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!projects?.length) {
    return (
      <EmptyState
        icon={<FolderOpen size={20} />}
        title="No projects yet"
        description="Create your first project to start storing secrets with context."
        action={
          <div className="flex items-center justify-center gap-3">
            <Button onClick={onNew} size="sm">
              Create Project
            </Button>
            {onImportGithub && (
              <Button onClick={onImportGithub} size="sm" variant="secondary">
                <FolderDown size={15} />
                Import from GitHub
              </Button>
            )}
          </div>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
          onExport={onExport}
        />
      ))}
    </div>
  )
}
