import { parseUrl } from '@aws-sdk/url-parser'
import { Hash } from '@aws-sdk/hash-node'
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { formatUrl } from '@aws-sdk/util-format-url'

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  method: string
  url: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { filename, fileType } = req.body

  const fileKey = `assets/${filename}`

  // e.g. https://my4x4-development.s3.ap-southeast-2.amazonaws.com/development/images/filename.jpg
  const s3ObjectUrl = parseUrl(
    `https://${process.env.PROJECT_AWS_S3_BUCKET}.s3.${process.env.PROJECT_AWS_REGION}.amazonaws.com/${fileKey}`,
  )

  const presignerOptions = {
    credentials: {
      accessKeyId: process.env.PROJECT_AWS_ACCESS_KEY || '',
      secretAccessKey: process.env.PROJECT_AWS_SECRET_ACCESS_KEY || '',
    },
    region: process.env.PROJECT_AWS_REGION || '',
    sha256: Hash.bind(null, 'sha256'),
  }

  const presigner = new S3RequestPresigner(presignerOptions)

  const presignedParams = await presigner.presign(
    new HttpRequest({ ...s3ObjectUrl, method: 'PUT' }),
    { expiresIn: 300 },
  )

  const result = {
    method: presignedParams.method,
    url: formatUrl(presignedParams),
  }

  res.status(200).json(result)
}
