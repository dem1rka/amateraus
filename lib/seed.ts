import * as FileSystem from "expo-file-system/legacy";
import { Client, ID, Storage } from "react-native-appwrite";
import { appwriteConfig, databases } from "./appwrite";
import dummyData from "./data";

console.log("databases import =", databases);

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

export const storage = new Storage(client);

interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[];
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
  const list = await databases.listDocuments(
    appwriteConfig.databaseId,
    collectionId
  );

  await Promise.all(
    list.documents.map((doc) =>
      databases.deleteDocument(
        appwriteConfig.databaseId,
        collectionId,
        doc.$id
      )
    )
  );
}

async function clearStorage(): Promise<void> {
  const list = await storage.listFiles(appwriteConfig.bucketId);

  await Promise.all(
    list.files.map((file) =>
      storage.deleteFile(appwriteConfig.bucketId, file.$id)
    )
  );
}

function normalizeKey(value: string): string {
  return value.toLowerCase().trim();
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getExtensionFromUrl(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const lastPart = clean.split("/").pop() || "";
  const ext = lastPart.includes(".") ? lastPart.split(".").pop()?.toLowerCase() : "";

  if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return ext;
  }

  return "png";
}

function getMimeType(ext: string): string {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "png":
    default:
      return "image/png";
  }
}

async function uploadImageToStorage(imageUrl: string, itemName: string): Promise<string> {
  const ext = getExtensionFromUrl(imageUrl);
  const fileName = sanitizeFileName(`${itemName}_${Date.now()}.${ext}`);
  const localUri = `${FileSystem.cacheDirectory}${fileName}`;

  console.log("⬇️ downloading:", itemName, imageUrl);

  const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);

  if (downloadResult.status !== 200) {
    throw new Error(
      `Failed to download image for "${itemName}". Status: ${downloadResult.status}`
    );
  }

  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists) {
    throw new Error(`Downloaded file not found for "${itemName}"`);
  }

  const file = {
    uri: localUri,
    name: fileName,
    type: getMimeType(ext),
    size: fileInfo.size ?? 0,
  };

  console.log("⬆️ uploading to storage:", itemName, file);

  const uploaded = await storage.createFile(
    appwriteConfig.bucketId,
    ID.unique(),
    file
  );

  const fileUrl = storage.getFileViewURL(appwriteConfig.bucketId, uploaded.$id);

  console.log("✅ uploaded image:", itemName, fileUrl);

  return fileUrl;
}

export async function seed(): Promise<void> {
  try {
    console.log("🚀 START SEED");

    await clearAll(appwriteConfig.menuCustomizationsCollectionId);
    await clearAll(appwriteConfig.menuCollectionId);
    await clearAll(appwriteConfig.customizationsCollectionId);
    await clearAll(appwriteConfig.categoriesCollectionId);
    await clearStorage();

    const categoryMap: Record<string, string> = {};

    for (const cat of data.categories) {
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.categoriesCollectionId,
        ID.unique(),
        {
          name: cat.name,
          description: cat.description,
        }
      );

      categoryMap[normalizeKey(cat.name)] = doc.$id;
      console.log("✅ category:", cat.name, doc.$id);
    }

    const customizationMap: Record<string, string> = {};

    for (const cus of data.customizations) {
      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.customizationsCollectionId,
        ID.unique(),
        {
          name: cus.name,
          price: cus.price,
          type: cus.type,
        }
      );

      customizationMap[normalizeKey(cus.name)] = doc.$id;
      console.log("✅ customization:", cus.name, doc.$id);
    }

    for (const item of data.menu) {
      const categoryId = categoryMap[normalizeKey(item.category_name)];

      if (!categoryId) {
        throw new Error(`Category not found: ${item.category_name} for "${item.name}"`);
      }

      console.log("🍔 creating menu:", item.name);

      const uploadedImageUrl = await uploadImageToStorage(item.image_url, item.name);

      const doc = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuCollectionId,
        ID.unique(),
        {
          name: item.name,
          description: item.description,
          image_url: uploadedImageUrl,
          price: item.price,
          rating: item.rating,
          calories: item.calories,
          protein: item.protein,
          categories: [categoryId],
          categoryId: categoryId    
        }
      );

      console.log("✅ menu:", item.name, doc.$id);

      for (const cusName of item.customizations) {
        const cusId = customizationMap[normalizeKey(cusName)];

        if (!cusId) {
          throw new Error(`Customization not found: ${cusName} for "${item.name}"`);
        }

        await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuCustomizationsCollectionId,
          ID.unique(),
          {
            menu: doc.$id,
            customizations: cusId,
          }
        );

        console.log("🔗 linked:", item.name, "->", cusName);
      }
    }

    console.log("✅ SEED DONE");
  } catch (error) {
    console.log("❌ SEED ERROR:", error);
    throw error;
  }
}