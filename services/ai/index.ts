export { generateAiResponse, streamAiResponse } from "./coach.service";
export { parseUserCommand } from "./command.service";
export { parseMeal } from "./meal-parser.service";
export { transcribeAudio } from "./audio.service";
export type {
  AiUserCommand,
  ConversationMessage,
  NutritionItem,
  ParsedMeal,
} from "./types";
