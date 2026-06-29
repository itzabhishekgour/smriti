import { useState, useEffect } from 'react'
import { Upload, X, Check, FileText } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { parseFileContent } from '../../utils/fileParser'
import { aiService } from '../../services/aiService'
import { projectService } from '../../services/projectService'
import { secretService } from '../../services/secretService'
import { toast } from 'react-hot-toast'

export default function ImportModal({ open, onClose, onImportSuccess }) {
  const [step, setStep] = useState(1) // 1: Upload, 2: Review
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [parsedSecrets, setParsedSecrets] = useState([]) // array of { selected, key, value, serviceName, tags }

  useEffect(() => {
    if (open) {
      setStep(1)
      setParsedSecrets([])
      setNewProjectName('')
      setSelectedProjectId('')
      fetchProjects()
    }
  }, [open])

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll()
      setProjects(data)
    } catch (e) {
      toast.error('Failed to load projects')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const rawSecrets = parseFileContent(file.name, text)
      const keys = Object.keys(rawSecrets)

      if (keys.length === 0) {
        toast.error('No valid secrets found in file')
        return
      }

      setLoading(true)
      try {
        const aiMetadata = await aiService.bulkParse(keys)
        
        const enriched = keys.map(key => {
          const aiGuess = aiMetadata.find(m => m.key === key) || {}
          return {
            selected: true,
            key,
            value: rawSecrets[key],
            serviceName: aiGuess.serviceName || '',
            tags: aiGuess.tags ? aiGuess.tags.join(', ') : ''
          }
        })
        setParsedSecrets(enriched)
        setStep(2)
      } catch (err) {
        toast.error('Failed to parse file with AI')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const handleToggleSelect = (index) => {
    const newSecrets = [...parsedSecrets]
    newSecrets[index].selected = !newSecrets[index].selected
    setParsedSecrets(newSecrets)
  }

  const handleChange = (index, field, val) => {
    const newSecrets = [...parsedSecrets]
    newSecrets[index][field] = val
    setParsedSecrets(newSecrets)
  }

  const handleImport = async () => {
    let projectId = selectedProjectId
    const toImport = parsedSecrets.filter(s => s.selected)
    
    if (toImport.length === 0) {
      toast.error('Please select at least one secret to import')
      return
    }

    if (!projectId) {
      if (!newProjectName.trim()) {
        toast.error('Please select or create a project')
        return
      }
      setLoading(true)
      try {
        const p = await projectService.create({ name: newProjectName })
        projectId = p.id
      } catch (e) {
        toast.error('Failed to create new project')
        setLoading(false)
        return
      }
    }

    setLoading(true)
    try {
      const requests = toImport.map(s => ({
        name: s.key,
        value: s.value,
        serviceName: s.serviceName,
        tags: s.tags,
        environment: 'dev', // Default assignment
        category: 'other',
        originNote: 'Imported in bulk'
      }))

      await secretService.createBulk(projectId, requests)
      toast.success(`${toImport.length} secrets imported successfully!`)
      onImportSuccess(projectId)
      onClose()
    } catch (e) {
      toast.error('Failed to import secrets')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk Import Secrets" size="xl">
      {step === 1 && (
        <div className="p-8 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg m-6 bg-neutral-50 dark:bg-neutral-900/50">
          <Upload className="w-12 h-12 text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2">Upload Configuration File</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center max-w-sm">
            Supported formats: .env, .json, .yaml. We will securely extract keys and use AI to guess their service and tags.
          </p>
          <div className="relative">
            <Button variant="primary" loading={loading} onClick={() => document.getElementById('file-upload-input').click()}>
              Select File
            </Button>
            <input
              id="file-upload-input"
              type="file"
              className="hidden"
              accept=".env,.json,.yaml,.yml"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
          {/* Project Selection */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Select Target Project</label>
              <select 
                className="input-base w-full"
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value)
                  if(e.target.value) setNewProjectName('')
                }}
              >
                <option value="">-- Create New Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            {!selectedProjectId && (
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Or New Project Name</label>
                <input 
                  className="input-base w-full"
                  placeholder="e.g. Imported Configurations"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Secrets Table */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800/50 text-xs uppercase tracking-wider text-neutral-500">
                  <th className="p-3 w-10 text-center">Import</th>
                  <th className="p-3">Key Name</th>
                  <th className="p-3">AI Guessed Service ✨</th>
                  <th className="p-3">AI Guessed Tags ✨</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {parsedSecrets.map((s, idx) => (
                  <tr key={idx} className={s.selected ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50 dark:bg-neutral-900/50 opacity-50'}>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={s.selected}
                        onChange={() => handleToggleSelect(idx)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="p-3 font-mono text-sm text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]" title={s.key}>
                      {s.key}
                    </td>
                    <td className="p-3">
                      <input 
                        className="input-base text-sm py-1.5 px-2"
                        value={s.serviceName}
                        onChange={(e) => handleChange(idx, 'serviceName', e.target.value)}
                        placeholder="e.g. AWS"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        className="input-base text-sm py-1.5 px-2"
                        value={s.tags}
                        onChange={(e) => handleChange(idx, 'tags', e.target.value)}
                        placeholder="tag1, tag2"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>Back</Button>
            <Button onClick={handleImport} loading={loading}>
              Confirm & Import ({parsedSecrets.filter(s => s.selected).length})
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
