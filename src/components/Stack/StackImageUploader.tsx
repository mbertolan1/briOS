import Image from 'next/image'
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Trash, Upload } from 'react-feather'

import { LoadingSpinner } from '~/components/LoadingSpinner'
import { CLOUDFLARE_IMAGE_DELIVERY_BASE_URL } from '~/lib/cloudflare'

export function StackImageUploader({ stack, onImageUploaded }) {
  const [loading, setLoading] = useState(false)
  const [initialImage, setInitialImage] = useState(stack?.image)
  const [previewImage, setPreviewImage] = useState(null)

  async function getSignedUrl() {
    const data = await fetch('/api/images/sign').then((res) => res.json())
    return data?.uploadURL
  }

  async function uploadFile({ file, signedUrl }) {
    const data = new FormData()
    data.append('file', file)
    const upload = await fetch(signedUrl, {
      method: 'POST',
      body: data,
    }).then((r) => r.json())
    return upload?.result?.id
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    setLoading(true)
    const file = acceptedFiles[0]
    const signedUrl = await getSignedUrl()

    if (!signedUrl) {
      setLoading(false)
      return console.error('No signed url')
    }

    const id = await uploadFile({ file, signedUrl })
    if (!id) {
      setLoading(false)
      return console.error('Upload failed')
    }

    const url = `${CLOUDFLARE_IMAGE_DELIVERY_BASE_URL}/${id}/stack`
    setLoading(false)
    setPreviewImage(url)
    return onImageUploaded(url)
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: 1000 * 1000, // 1mb
    accept: '.jpg,.png,.jpeg',
    multiple: false,
  })

  if (initialImage || previewImage) {
    return (
      <div className="relative inline-block w-24 h-24 border border-gray-100 rounded-lg dark:border-gray-900">
        <Image
          src={initialImage || previewImage}
          width="96"
          height="96"
          layout="fixed"
          quality={100}
          className={`rounded-lg inline-block`}
        />
        <button
          onClick={() => {
            setInitialImage(false)
            setPreviewImage(null)
            onImageUploaded(null)
          }}
          className="absolute p-2 text-white border-2 border-white rounded-full shadow-md cursor-pointer hover:bg-red-500 dark:bg-gray-700 dark:border-gray-800 -top-3 -right-3 bg-gray-1000 focus:bg-red-500"
        >
          <Trash size={16} />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`flex items-center justify-center w-24 h-24 p-6 border border-gray-200 border-dashed rounded-md dark:border-gray-700 bg-gray-100 hover:bg-gray-150 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-800 text-tertiary cursor-pointer`}
    >
      <input {...getInputProps()} />
      {loading ? <LoadingSpinner /> : <Upload size={16} />}
    </div>
  )
}
