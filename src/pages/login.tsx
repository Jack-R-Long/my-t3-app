import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { useForm } from 'react-hook-form'
import { CreateUserInput } from "../schema/user.schema"
import { trpc } from "../utils/trpc"

function RegisterPage() {
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
        mutate(values)
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

export default RegisterPage
