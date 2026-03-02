import { Test, TestingModule } from '@nestjs/testing';
import { GameObjectsController } from './game-objects.controller.js';

describe('GameObjectsController', () => {
  let controller: GameObjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameObjectsController],
    }).compile();

    controller = module.get<GameObjectsController>(GameObjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
