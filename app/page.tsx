import { redirect } from 'next/navigation'

export default function Home() {
  // In a real app, this would check the user's authentication and role
  // For now, redirect to admin dashboard
  redirect('/admin')
}
