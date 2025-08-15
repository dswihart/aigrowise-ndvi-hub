### **Section 4: Data Models**

#### **Model 1: User**

* **Purpose**: To store client and administrator account information.
* **Prisma Schema**:
  ```typescript
  model User {
    id        String   @id @default(cuid())
    email     String   @unique
    password  String
    role      Role     @default(CLIENT)
    images    Image[]
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }

  enum Role {
    CLIENT
    ADMIN
  }
  ```
* **Relationships**: A `User` can have many `Images`.

#### **Model 2: Image**

* **Purpose**: To store metadata about each uploaded NDVI image.
* **Prisma Schema**:
  ```typescript
  model Image {
    id        String   @id @default(cuid())
    url       String
    user      User     @relation(fields: [userId], references: [id])
    userId    String
    createdAt DateTime @default(now())
  }
  ```
* **Relationships**: An `Image` belongs to one `User`.

***
