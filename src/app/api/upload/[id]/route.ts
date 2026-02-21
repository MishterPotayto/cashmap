import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  const upload = await prisma.csvUpload.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!upload || upload.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete transactions tied to this upload, then the upload record
  await prisma.transaction.deleteMany({ where: { csvUploadId: id, userId: session.user.id } });
  await prisma.csvUpload.delete({ where: { id } });

  return NextResponse.json({ success: true });
}