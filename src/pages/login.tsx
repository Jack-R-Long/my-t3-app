import Link from "next/link"
import { useRouter } from "next/router"
import { useForm } from 'react-hook-form'
import { CreateUserInput } from "../schema/user.schema"
import { trpc } from "../utils/trpc"

function RegisterPage() {
    const { handleSubmit, register } = useForm<CreateUserInput>()
    const router = useRouter()

    const { mutate, error } = trpc.useMutation(['users.register-user'], {
        onSuccess: () => {
            router.push('/login')
        }


    })

    function onSubmit(values: CreateUserInput) {
        mutate(values)
    }

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                <h1>Register</h1>
                <input type="email" placeholder="jane@jane.com" {...register('email')} />
                <br />
                <input type="text" placeholder="name" {...register('name')} />
                <button type="submit">Register</button>


            </form>
            {error && error.message}
            <Link href="/login">Login</Link>
        </>
    )
}

export default RegisterPage