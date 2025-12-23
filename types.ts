
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  available?: boolean;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ShoppingList {
  VegetableShop: Ingredient[];
  GroceryShop: Ingredient[];
}

export interface RecipeResponse {
  recipeTitle: string;
  cookTime: string;
  nutrition: Nutrition;
  ingredients: RecipeIngredient[];
  steps: string[];
  substitutions: string[];
  shoppingList: ShoppingList;
}

export interface RecipeFormData {
  dishName: string;
  peopleCount: number;
  restrictions: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  role: 'customer' | 'owner';
  location?: string;
  lat?: number;
  lng?: number;
  shopName?: string;
  storeType?: string;
}

export interface ShopProximity {
  shopName: string;
  phone: string;
  distance: number;
  storeType: string;
}

export interface IncomingList {
  id: string;
  customerName: string;
  customerPhone: string;
  shopPhone?: string;
  items: Ingredient[];
  timestamp: any;
  status: 'pending' | 'accepted' | 'rejected' | 'ready' | 'completed';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
