import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import db from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Start a transaction to delete all related data
    await db.$transaction(async (tx) => {
      // Delete all business user roles
      await tx.businessUserRole.deleteMany({
        where: { userId }
      });

      // Delete all payments created by the user
      await tx.payment.updateMany({
        where: { createdBy: userId },
        data: { createdBy: 'deleted-user' } // Keep payment records but anonymize
      });

      // Delete all invoices created by the user (this will cascade delete items, taxes, etc.)
      await tx.invoice.updateMany({
        where: { createdBy: userId },
        data: { createdBy: 'deleted-user' } // Keep invoice records but anonymize
      });

      // Delete businesses owned by the user (this will cascade delete all related data)
      const ownedBusinesses = await tx.businessUserRole.findMany({
        where: {
          userId,
          role: 'OWNER'
        },
        select: { businessId: true }
      });

      for (const { businessId } of ownedBusinesses) {
        await tx.business.delete({
          where: { id: businessId }
        });
      }

      // Finally, delete the user account
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (error) {
    console.error("[USER_ACCOUNT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}