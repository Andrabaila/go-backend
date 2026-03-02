import { Test, TestingModule } from '@nestjs/testing';
import { GameObjectsService } from './game-objects.service.js';

describe('GameObjectsService', () => {
  let service: GameObjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameObjectsService],
    }).compile();

    service = module.get<GameObjectsService>(GameObjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
