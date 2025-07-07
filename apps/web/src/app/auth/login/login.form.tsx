'use client'

import type { FieldValues } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { MoveRight } from 'lucide-react'
import { redirect, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

  import { authClient } from '@better-analytics/auth/client'
import { Button } from '@better-analytics/ui/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@better-analytics/ui/components/form'
import { Input } from '@better-analytics/ui/components/input'
import { LoginSchema } from './login.schema'
import { Github } from "@better-analytics/ui/icons";


export function LoginForm() {
  const callbackURL = useSearchParams().get('from') ?? '/dashboard'

  const form = useForm<LoginSchema>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(formData: LoginSchema) {
    const { error } = await authClient.signIn.magicLink({
      email: formData.email,
      callbackURL: callbackURL,
    })

    if (error) {
      return toast.error(error.message)
    }

    toast.success('Check your email for a login link.')
    redirect(callbackURL)
  }

  async function githubLogin() {
		await authClient.signIn.social({
			provider: "github",
			callbackURL: "/dashboard",
			fetchOptions: {
				onError: (context) => {
					toast.error(context.error.message);
				},
				onSuccess: () => {
					toast.success("Redirecting...");
				},
			},
		});
	}

  return (
    <Suspense>
      <Form {...form}>
        <form
          className="flex w-full flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            name="email"
            control={form.control}
            render={({ field }: FieldValues) => (
              <FormItem className="flex flex-col">
                <FormLabel>Email</FormLabel>

                <FormControl>
                  <Input className="font-mono" type="text" placeholder="hello@databuddy.cc" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-center select-none">
            <div className="w-full h-px bg-border" />
            <span className="px-2 text-muted-foreground">or</span>
            <div className="w-full h-px bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={githubLogin}>
            <Github className="mr-2 size-4" />
            Continue with GitHub
          </Button>

          <Button type="submit">
          Login <MoveRight className="ml-2 size-3.5" />
          </Button>
        </form>
      </Form>
    </Suspense>
  )
}
