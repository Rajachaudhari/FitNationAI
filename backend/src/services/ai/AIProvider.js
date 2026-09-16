/**
 * Abstract AI Provider Interface
 */
export class AIProvider {
  async chat(messages, userContext) {
    throw new Error("chat() must be implemented by concrete provider");
  }

  async generateWorkout(profile, preferences) {
    throw new Error("generateWorkout() must be implemented by concrete provider");
  }

  async parseFood(naturalText) {
    throw new Error("parseFood() must be implemented by concrete provider");
  }
}
