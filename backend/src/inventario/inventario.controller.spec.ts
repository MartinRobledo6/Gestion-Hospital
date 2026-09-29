import { Test, TestingModule } from '@nestjs/testing';
import { InventarioController } from './inventario.controller.js';
import { InventarioService } from './inventario.service.js';

describe('InventarioController', () => {
  let controller: InventarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventarioController],
      providers: [InventarioService],
    }).compile();

    controller = module.get<InventarioController>(InventarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
