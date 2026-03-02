import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUpdateProfile } from '@/queries/auth.queries'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validators'
import { UserAvatar } from '@/components/user/UserAvatar'
import { extractErrorMessage, getMediaUrl } from '@/lib/utils'

export default function EditProfilePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    getMediaUrl(user?.profile_picture ?? null)
  )

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      first_name: user?.first_name,
      last_name: user?.last_name,
      bio: user?.bio,
      country: user?.country,
      gender: user?.gender ?? undefined,
      dob: user?.dob ?? undefined,
    },
  })

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      if (!file) return
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    },
  })

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile(
      { ...data, profile_picture: avatarFile ?? undefined },
      {
        onSuccess: () => {
          toast.success('Profile updated!')
          navigate(`/profile/${user?.username}`)
        },
        onError: (err) => toast.error(extractErrorMessage(err)),
      }
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Edit Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {/* Avatar */}
        <div className="flex justify-center">
          <div {...getRootProps()} className="relative cursor-pointer group">
            <input {...getInputProps()} />
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              user && <UserAvatar user={user} size="xl" />
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First name</label>
            <input {...register('first_name')} className="input-base" />
            {errors.first_name && <p className="error">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="label">Last name</label>
            <input {...register('last_name')} className="input-base" />
          </div>
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea {...register('bio')} rows={3} className="input-base resize-none" placeholder="Tell the world about yourself" />
          {errors.bio && <p className="error">{errors.bio.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Country</label>
            <input {...register('country')} className="input-base" placeholder="e.g. Pakistan" />
          </div>
          <div>
            <label className="label">Gender</label>
            <select {...register('gender')} className="input-base">
              <option value="">Select…</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Date of birth</label>
          <input {...register('dob')} type="date" className="input-base" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
            {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
