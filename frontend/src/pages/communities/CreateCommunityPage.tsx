import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateCommunity } from '@/queries/communities.queries'
import { createCommunitySchema, type CreateCommunityInput } from '@/lib/validators'
import { extractErrorMessage } from '@/lib/utils'

export default function CreateCommunityPage() {
  const navigate = useNavigate()
  const { mutate: createCommunity, isPending } = useCreateCommunity()
  const [banner, setBanner] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<CreateCommunityInput>({
    resolver: zodResolver(createCommunitySchema),
  })

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      if (!file) return
      setBanner(file)
      setBannerPreview(URL.createObjectURL(file))
    },
  })

  const onSubmit = (data: CreateCommunityInput) => {
    createCommunity(
      { ...data, banner: banner ?? undefined },
      {
        onSuccess: (community) => {
          toast.success(`Community "${community.name}" created!`)
          navigate(`/communities/${community.id}`)
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      }
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Create Community</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {/* Banner */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Banner Image (optional)
          </label>
          {bannerPreview ? (
            <img src={bannerPreview} alt="banner" className="w-full h-32 object-cover rounded-xl" />
          ) : (
            <div
              {...getRootProps()}
              className="cursor-pointer flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-text-muted hover:border-accent hover:text-accent transition-colors"
            >
              <input {...getInputProps()} />
              <Upload size={20} />
              <p className="text-sm">Upload banner image</p>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Name *</label>
          <input {...register('name')} className="input-base" placeholder="e.g. Photography Enthusiasts" />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">About *</label>
          <textarea
            {...register('about')}
            rows={3}
            className="input-base resize-none"
            placeholder="What is this community about?"
          />
          {errors.about && <p className="mt-1 text-xs text-danger">{errors.about.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Rules (optional, one per line)
          </label>
          <textarea
            {...register('rules')}
            rows={4}
            className="input-base resize-none"
            placeholder={'Be respectful\nNo spam\nStay on topic'}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/communities')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
            {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {isPending ? 'Creating…' : 'Create Community'}
          </button>
        </div>
      </form>
    </div>
  )
}
