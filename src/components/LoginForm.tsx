import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { useForm } from 'react-hook-form'
import { CreateUserInput } from "../schema/user.schema"
import { trpc } from "../utils/trpc"

function VerifyToken({ hash }: { hash: string }) {

    const router = useRouter()
    const { data, isLoading } = trpc.useQuery(['users.verifyOTP', {
        hash,
    }])

    if (isLoading) {
        return <p>Verifying...</p>
    }

    router.push(data?.redirect.includes('login') ? '/' : data?.redirect || '/')

    return <p>Redirecting...</p>


}

function LoginForm() {
    const { handleSubmit, register } = useForm<CreateUserInput>()
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const { mutate, error } = trpc.useMutation(['users.requestOTP'], {
        onSuccess: () => {
            // router.push('/login')
            setSuccess(true)
        }
    })

    function onSubmit(values: CreateUserInput) {
        mutate({ ...values, redirect: router.asPath })
    }

    const hash = router.asPath.split('#token=')[1]

    if (hash) {
        return <VerifyToken hash="hash" />
    }

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                {error && error.message}

                {success && <p>Check your email</p>}
                <h1>Login</h1>
                <input type="email" placeholder="jane@jane.com" {...register('email')} />
                <button type="submit">Login </button>


            </form>
            {/* <Link href="/register">Login</Link> */}
        </>
    )
}

export default LoginForm
