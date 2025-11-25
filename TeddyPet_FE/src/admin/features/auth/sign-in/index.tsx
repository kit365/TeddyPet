
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/admin/components/ui/card'
import { AuthLayout } from '../auth-layout'

type FormValues = any

export function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || ''
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (_values: FormValues) => {
    setServerError(null)
    try {
      // TODO: call your login API here
      await new Promise((r) => setTimeout(r, 300))
      navigate(redirect || '/admin', { replace: true })
    } catch (e: any) {
      setServerError(e?.message || 'Sign in failed')
    }
  }

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Sign in</CardTitle>
          <CardDescription>
            Enter your email and password below to <br />
            log into your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {serverError ? (
              <div className='text-sm text-red-600'>{serverError}</div>
            ) : null}

            <div className='space-y-2'>
              <label htmlFor='email' className='text-sm font-medium'>
                Email
              </label>
              <input
                id='email'
                type='email'
                autoComplete='email'
                className='w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary'
                placeholder='you@example.com'
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email ? (
                <p className='text-xs text-red-600'>{String(errors.email.message)}</p>
              ) : null}
            </div>

            <div className='space-y-2'>
              <label htmlFor='password' className='text-sm font-medium'>
                Password
              </label>
              <input
                id='password'
                type='password'
                autoComplete='current-password'
                className='w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary'
                placeholder='••••••••'
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password ? (
                <p className='text-xs text-red-600'>{String(errors.password.message)}</p>
              ) : null}
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60'
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            By clicking sign in, you agree to our{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
