
import { GoogleGenAI, Type } from "@google/genai";
import { RecipeResponse, RecipeFormData } from "../types";

// --- CUSTOMER SCHEMAS ---
const metricIngredientSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    quantity: { type: Type.NUMBER },
    unit: { type: Type.STRING },
  },
  required: ["name", "quantity", "unit"],
};

const culinaryIngredientSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    amount: { type: Type.STRING },
  },
  required: ["name", "amount"],
};

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    recipeTitle: { type: Type.STRING },
    cookTime: { type: Type.STRING },
    nutrition: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
      },
      required: ["calories", "protein", "carbs", "fat"],
    },
    ingredients: {
      type: Type.ARRAY,
      items: culinaryIngredientSchema,
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    substitutions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    shoppingList: {
      type: Type.OBJECT,
      properties: {
        VegetableShop: { type: Type.ARRAY, items: metricIngredientSchema },
        GroceryShop: { type: Type.ARRAY, items: metricIngredientSchema },
      },
      required: ["VegetableShop", "GroceryShop"],
    },
  },
  required: ["recipeTitle", "cookTime", "nutrition", "ingredients", "steps", "substitutions", "shoppingList"],
};

const RECIPE_SYSTEM_INSTRUCTION = `
You are PortionPerfect Customer AI.  
Generate recipes for home cooks with surgical precision.
Rules:
1. SIMPLE ONLY: Minimum essential ingredients. or medium ingredients are also fine but not too high.
2. INDIAN TERMS: Hing, Ghee, Ajwain, Methi, Coriander, Brinjal, Besan, Lady Finger, Curd.
3. SCALING: Scale for requested people count exactly.
4. UNITS: Recipe uses tbsp/cups. Shopping list uses precise grams/kg.
5. SHOP CATEGORIES: VegetableShop (Fresh) vs GroceryShop (Packaged).
6. While giving the items to the shopping list, if the ingredient needed is less than 100g make it 100g standard because shops can't have 10g or 5g items.
`;

export const generateRecipe = async (
  formData: RecipeFormData
): Promise<RecipeResponse> => {
  try {
    // Create instance right before call to ensure it uses the latest API key from the environment
    const ai = new GoogleGenAI({ apiKey: "AIzaSyDoNF_REthvJu1fuweUdzQQmKXe0AGbR5k" });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Upgraded to Pro for complex portion scaling and reasoning
      contents: `Generate a recipe for ${formData.dishName} serving ${formData.peopleCount}. ${formData.restrictions ? 'Dietary restrictions: ' + formData.restrictions : ''}`,
      config: {
        systemInstruction: RECIPE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 4096 }, // Reasoning budget for precise portion math
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response");
    return JSON.parse(jsonText) as RecipeResponse;
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    throw error;
  }
};
