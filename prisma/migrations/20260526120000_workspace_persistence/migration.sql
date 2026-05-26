ALTER TABLE "Conversation" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN "projectId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LikedChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LikedChat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserProviderKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserProviderKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResponseFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResponseFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Conversation_projectId_idx" ON "Conversation"("projectId");
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt");
CREATE UNIQUE INDEX "LikedChat_userId_conversationId_key" ON "LikedChat"("userId", "conversationId");
CREATE INDEX "LikedChat_userId_likedAt_idx" ON "LikedChat"("userId", "likedAt");
CREATE UNIQUE INDEX "UserProviderKey_userId_provider_key" ON "UserProviderKey"("userId", "provider");
CREATE INDEX "ResponseFeedback_userId_createdAt_idx" ON "ResponseFeedback"("userId", "createdAt");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LikedChat" ADD CONSTRAINT "LikedChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LikedChat" ADD CONSTRAINT "LikedChat_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserProviderKey" ADD CONSTRAINT "UserProviderKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResponseFeedback" ADD CONSTRAINT "ResponseFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResponseFeedback" ADD CONSTRAINT "ResponseFeedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
