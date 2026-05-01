export interface AppService<Input, Output> {
  execute(input: Input): Promise<Output>;
}
