"use client"

import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || (userRole !== 'ADMIN' && userRole !== 'STAFF'))) {
      router.push('/login')
    }
  }, [user, userRole, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-graphite-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user || (userRole !== 'ADMIN' && userRole !== 'STAFF')) {
    return null
  }

  return <>{children}</>
}