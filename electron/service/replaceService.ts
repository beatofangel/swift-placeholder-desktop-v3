import SQL from "../database/sql/sql.json";
import {
  sequelize, QueryTypes, Op, beginTx,
  BusinessCategoryModel,
  TemplateModel,
  TplPhGrpRelModel,
  BcTplRelModel,
  PlaceholderGroupModel,
  PlaceholderItemModel,
  PhGrpItmRelModel
} from "../database/sequelize";

// TODO 排序功能可以批量update，应当通过单独的api调用 或者 改造现有api，累积后一次性更新
// TODO 添加功能，根据级联业务类型选择器中选择的业务类型，查询所有子类型（含自身）所关联的模板（排除当前业务类型已经关联的模板），
// 用于添加模板时，可以从现有模板中选择。 *原有功能为添加新模板

/**
 * 级联查询业务分类
 *
 * @returns 业务分类（级联）
 */
export async function findBusinessCategoryCascaded() {
  return await beginTx(async (tx) => {
    return await BusinessCategoryModel.findAll({
      where: {
        [Op.and]: [
          {
            id: {
              [Op.notIn]: sequelize.literal(
                `(SELECT root.id FROM BusinessCategories AS root WHERE root.pid == root.id)`
              ),
            },
          },
          {
            pid: {
              [Op.in]: sequelize.literal(
                `(SELECT root.id FROM BusinessCategories AS root WHERE root.pid == root.id)`
              ),
            },
          },
        ],
      },
      order: [
        ["ordinal", 'DESC'],
        [sequelize.col("children.ordinal"), 'DESC'],
        [sequelize.col("children->children.ordinal"), 'DESC'],
      ],
      attributes: ["id", "name", "icon", "ordinal"],
      include: [{
        model: BusinessCategoryModel,
        as: "children",
        attributes: ["id", "name", "icon", "ordinal"],
        include: [{
          model: BusinessCategoryModel,
          as: "children",
          attributes: ["id", "name", "icon", "ordinal"],
        }],
      }],
    }).then((result: any[]) => {
      const formatted: any[] = [];
      const format = (items: any[], formatted: any[]) => {
        items.forEach((item) => {
          const dataValues = item.dataValues;
          const children = item.children;
          const formattedItem: any = {
            id: dataValues.id,
            name: dataValues.name,
            icon: dataValues.icon,
            ordinal: dataValues.ordinal
          };
          formatted.push(formattedItem);
          if (children && children.length) {
            formattedItem.children = [];
            format(children, formattedItem.children);
          }
        });
      };
      format(result, formatted);

      return formatted;
    });
  });
}

/**
 * 由于BusinessCategory是自表关联，需要先获取根节点id
 * @returns $root节点id
 */
export async function findBusinessCategoryRoot() {
  return await sequelize.transaction((tx) => {
    return BusinessCategoryModel.findOne({
      where: {
        id: sequelize.col("pid"),
      },
      attributes: ["id"],
      raw: true,
    });
  });
}

export async function findBusinessCategoryByPid({ pid }: { pid: string }) {
  return await sequelize.transaction((tx) => {
    return BusinessCategoryModel.findAll({
      where: {
        pid: pid,
        id: {
          [Op.ne]: pid,
        },
      },
      order: [["ordinal", 'DESC']],
      raw: true,
    }).then((result: any) => {
      console.log(result);
      return result;
    });
  });
}

/**
 * 保存业务分类
 *
 * @param {*} item
 * @returns
 */
export async function saveBusinessCategory(item: any) {
  return await bulkSaveBusinessCategory([item]);
}

/**
 * 批量保存业务分类
 *
 * @param {*} items
 * @returns
 */
export async function bulkSaveBusinessCategory(items: any[]) {
  return await beginTx(async (tx) => {
    const model = BusinessCategoryModel;
    for (const item of items) {
      if (item.delete) {
        await model.destroy({
          where: {
            id: item.id,
          },
        });
      } else if (item.insert) {
        await BusinessCategoryModel.create({
          name: item.name,
          icon: item.icon,
          pid: item.pid,
        });
      } else if (item.sort) {
        const businessCategory = await BusinessCategoryModel.findByPk(item.id);
        await businessCategory?.update({
          ordinal: item.ordinal,
        });
      } else {
        const businessCategory = await BusinessCategoryModel.findByPk(item.id);
        await businessCategory?.update({
          name: item.name,
          icon: item.icon,
        });
        // await model.upsert(item);
      }
    }
  });
}

/**
 * 根据业务分类查询模板
 * @param { {String} } param0
 * @returns 业务分类列表
 */
export async function findTemplateByBcId({ bcId }: { bcId: string }) {
  return await beginTx(async (tx) => {
    return await TemplateModel.findAll({
      attributes: ["id", "name", "path"],
      include: [
        {
          model: BusinessCategoryModel,
          where: {
            id: bcId,
          },
        },
      ],
      order: [[sequelize.col("BusinessCategories->BcTplRel.ordinal"), 'DESC']],
      raw: true,
      nest: true,
    }).then((result: any[]) =>
      result.map((item) => {
        return {
          id: item.id,
          name: item.name,
          path: item.path,
          ordinal: item.BusinessCategories.BcTplRel.ordinal,
          bcId: item.BusinessCategories.id,
        };
      })
    );
  });
}

/**
 * 保存模板
 *
 * @param {*} item
 * @returns
 */
export async function saveTemplate(item: any) {
  return await bulkSaveTemplate([item]);
}

/**
 * 批量保存模板
 *
 * @param {[]} items
 * @returns
 */
export async function bulkSaveTemplate(items: any[]) {
  return await beginTx(async (tx) => {
    for (const item of items) {
      const businessCategory = await BusinessCategoryModel.findByPk(item.bcId);

      if (item.delete) {
        // 删除
        await TemplateModel.destroy({
          where: {
            id: item.id,
          },
        });
      } else if (item.insert) {
        // 插入
        await businessCategory?.addTemplates(
          [
            await TemplateModel.create({ name: item.name, path: item.path })
          ],
          // {
          //   through: BcTplRelModel,
          // }
        );
      } else if (item.sort) {
        // 排序
        const bcTplRel = await BcTplRelModel.findOne({
          where: {
            bcId: item.bcId,
            tplId: item.id,
          },
        });
        await bcTplRel?.update({
          ordinal: item.ordinal,
        });
      } else {
        // 更新
        const template = await TemplateModel.findByPk(item.id);
        await template?.update({
          name: item.name,
          path: item.path,
        });
      }
    }
  });
}

/**
 * 根据模板查询占位符
 * @param { {String} } param0
 * @returns 业务分类列表
 */
export async function findPlaceholderByTplId({ tplId }: { tplId: string }) {
  return await beginTx(async (tx) => {
    return await PlaceholderGroupModel.findAll({
      attributes: ["id", "name"],
      include: [
        {
          model: TemplateModel,
          attributes: ["id"],
          where: {
            id: tplId,
          },
        },
        {
          model: PlaceholderItemModel,
          attributes: ["id", "name", "type", "format"],
        },
      ],
      order: [
        [sequelize.col("Templates->TplPhGrpRel.ordinal"), 'DESC'],
        [sequelize.col("PlaceholderItems->PhGrpItmRel.ordinal"), 'DESC'],
      ],
      // raw: true,
      // nest: true,
    }).then((result: any[]) =>
      result.map(
        ({ dataValues: group, PlaceholderItems: phItems, Templates: tpls }) => {
          return {
            id: group.id,
            name: group.name,
            ordinal: tpls[0].TplPhGrpRel.dataValues.ordinal,
            placeholders: phItems.map(({ dataValues: item }: { dataValues: any }) => {
              return {
                id: item.id,
                name: item.name,
                type: item.type,
                format: item.format,
                value: "",
                ordinal: item.PhGrpItmRel.dataValues.ordinal,
              };
            }),
          };
        }
      )
    );
  });
}

/**
 * 查询所有不属于当前模板的占位符分组
 *
 * @param {*} param0
 */
export async function findPlaceholderByTplIdExcluded({ tplId }: { tplId: string }) {
  return await beginTx(async (tx) => {
    return await PlaceholderGroupModel.findAll({
      attributes: ["id", "name"],
      include: [
        {
          model: TemplateModel,
          attributes: ["id", "name"],
          where: {
            id: {
              [Op.ne]: tplId,
            },
          },
        },
        {
          model: PlaceholderItemModel,
        },
      ],
      order: [
        [sequelize.col("Templates->TplPhGrpRel.ordinal"), 'DESC'],
        [sequelize.col("PlaceholderItems->PhGrpItmRel.ordinal"), 'DESC'],
      ],
    }).then((result: any[]) =>
      result.map(
        ({ dataValues: group, Templates: tpls, PlaceholderItems: phItms }) => {
          return {
            id: group.id,
            name: group.name,
            templates: tpls.map(({ dataValues: tpl }: { dataValues: any }) => {
              return {
                id: tpl.id,
                name: tpl.name,
              };
            }),
            placeholderItems: phItms.map(({ dataValues: phItm }: { dataValues: any }) => {
              return {
                id: phItm.id,
                name: phItm.name,
                type: phItm.type,
                format: phItm.format,
                ordinal: phItm.PhGrpItmRel.dataValues.ordinal,
              };
            }),
          };
        }
      )
    );
  });
}

export async function findPlaceholderItemByPhGrpId({ phGrpId }: { phGrpId: string }) {
  return await beginTx(async (tx) => {
    return await PlaceholderItemModel.findAll({
      attributes: ["id", "name", "type", "format"],
      include: {
        model: PlaceholderGroupModel,
        where: {
          id: phGrpId,
        },
      },
      order: [[sequelize.col("PlaceholderGroups->PhGrpItmRel.ordinal"), 'DESC']],
    }).then((result: any[]) =>
      result.map(({ dataValues: item, PlaceholderGroups: phGroups }) => {
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          format: item.format,
          ordinal: phGroups[0].PhGrpItmRel.dataValues.ordinal,
        };
      })
    );
  });
}

/**
 * 保存占位符分组
 *
 * @param {*} item
 * @returns
 */
export async function savePlaceholderGroup(item: any) {
  return await bulkSavePlaceholderGroup([item]);
}

/**
 * 批量保存占位符分组 TODO 待测试，模板编辑也需要考虑复杂情况
 *
 * @param {[{ id: String?, name: String, delete: Boolean?, insert: Boolean?, sort: Boolean?, bind: Boolean? PlaceholderItems:[{ name: String, type: String, format: String?, delete: Boolean?, insert: Boolean?, sort: Boolean?, bind: Boolean? }] }]} items
 * @returns
 */
export async function bulkSavePlaceholderGroup(items: any[]) {
  return await beginTx(async (tx) => {
    for (const item of items) {
      if (item.delete) {
        // TODO 是否会残留未与分组绑定的占位符？ 是
        const group = await PlaceholderGroupModel.findOne({
          where: {
            id: item.id,
          },
          include: [{
            model: PlaceholderItemModel,
            include: [{
              model: PlaceholderGroupModel,
              attributes: ["id"],
              // where: {
              //   id: {
              //     [Op.ne]: item.id
              //   }
              // }
            }],
          }],
        });
        await PlaceholderGroupModel.destroy({
          where: {
            id: item.id,
          },
        });
        for (const item of (await group?.getPlaceholderItems() || [])) {
          if ((await item.getPlaceholderGroups()).length == 1) {
            // 当前分组所关联的项目未被其他分组使用，可以删除
            await PlaceholderItemModel.destroy({
              where: {
                id: item.id,
              },
            });
          }
        }

        // if (group.PlaceholderItems.length == 1) { // 当前分组所关联的项目未被其他分组使用，可以删除
        //   console.log(group)
        //   await PlaceholderItemModel.destroy({
        //     where: {
        //       id: group.PlaceholderItems[0].id
        //     }
        //   })
        // }
      } else if (item.insert) {
        const template = await TemplateModel.findByPk(item.tplId);
        const placeholderGroup = await PlaceholderGroupModel.create({
          name: item.name,
        });
        await template?.addPlaceholderGroups(
          [
            placeholderGroup
          ],
          // {
          //   through: TplPhGrpRelModel,
          // }
        );

        for (const phItem of item.placeholderItems) {
          if (phItem.delete) {
            // dead code
            new Error("group:insert->item:delete not implemented")
            // await PlaceholderItemModel.destroy({
            //   where: {
            //     id: phItem.id,
            //   },
            // })
          } else if (phItem.insert) {
            await placeholderGroup.addPlaceholderItems(
              [await PlaceholderItemModel.create({
                name: phItem.name,
                type: phItem.type,
                format: phItem.format,
              })],
              // {
              //   through: PhGrpItmRelModel,
              // }
            );
          } else if (phItem.sort) {
            // dead code
            new Error("group:insert->item:sort not implemented")
            // const phGrpItmRel = await PhGrpItmRelModel.findOne({
            //   where: {
            //     phGrpId: phItem.phGrpId,
            //     phItmId: phItem.id
            //   }
            // })
            // await phGrpItmRel.update({
            //   ordinal: phItem.ordinal
            // })
          } else if (phItem.bind) {
            const placeholderItem = await PlaceholderItemModel.findByPk(
              phItem.id
            )
            placeholderItem && await placeholderGroup.addPlaceholderItems(
              [
                placeholderItem
              ],
              // {
              //   through: PhGrpItmRelModel,
              // }
            )
          } else {
            // dead code
            new Error("group:insert->item:update not implemented")
            // const placeholderItem = await PlaceholderItemModel.findByPk(phItem.id)
            // await placeholderItem.update({
            //   name: phItem.name,
            //   type: phItem.type,
            //   format: phItem.format
            // })
          }
        }
      } else if (item.sort) {
        // 占位符分组排序功能由另外的api单独提供
        const tplPhGrpRel = await TplPhGrpRelModel.findOne({
          where: {
            tplId: item.tplId,
            phGrpId: item.id,
          },
        });
        await tplPhGrpRel?.update({
          ordinal: item.ordinal,
        });
      } else if (item.bind) {
        const template = await TemplateModel.findByPk(item.tplId);
        const placeholderGroup = await PlaceholderGroupModel.findByPk(item.id);
        placeholderGroup && await template?.addPlaceholderGroups(
          [
            placeholderGroup
          ],
          // {
          //   through: TplPhGrpRelModel,
          // }
        )
        for (const phItem of item.placeholderItems) {
          if (phItem.delete) {
            // dead code
            new Error("group:bind->item:delete not implemented")
            // await PlaceholderItemModel.destroy({
            //   where: {
            //     id: phItem.id,
            //   },
            // })
          } else if (phItem.insert) {
            await placeholderGroup?.addPlaceholderItems(
              [await PlaceholderItemModel.create({
                name: phItem.name,
                type: phItem.type,
                format: phItem.format,
              })],
              // {
              //   through: PhGrpItmRelModel,
              // }
            );
          } else if (phItem.sort) {
            // dead code
            new Error("group:bind->item:sort not implemented")
            // const phGrpItmRel = await PhGrpItmRelModel.findOne({
            //   where: {
            //     phGrpId: phItem.phGrpId,
            //     phItmId: phItem.id
            //   }
            // })
            // await phGrpItmRel.update({
            //   ordinal: phItem.ordinal
            // })
          } else if (phItem.bind) {
            const placeholderItem = await PlaceholderItemModel.findByPk(
              phItem.id
            );
            placeholderItem && await placeholderGroup?.addPlaceholderItems(
              [
                placeholderItem
              ],
              // {
              //   through: PhGrpItmRelModel,
              // }
            );
          } else {
            // dead code
            new Error("group:bind->item:update not implemented")
            // const placeholderItem = await PlaceholderItemModel.findByPk(phItem.id)
            // await placeholderItem.update({
            //   name: phItem.name,
            //   type: phItem.type,
            //   format: phItem.format
            // })
          }
        }
      } else {
        const placeholderGroup = await PlaceholderGroupModel.findByPk(item.id);
        await placeholderGroup?.update({
          name: item.name,
        });

        for (const phItem of item.placeholderItems) {
          if (phItem.delete) {
            // dead code 删除由单独的api来实现
            new Error("group:update->item:delete not implemented")
            // await PlaceholderItemModel.destroy({
            //   where: {
            //     id: phItem.id,
            //   },
            // })
          } else if (phItem.insert) {
            await placeholderGroup?.addPlaceholderItems(
              [await PlaceholderItemModel.create({
                name: phItem.name,
                type: phItem.type,
                format: phItem.format,
              })],
              // {
              //   through: PhGrpItmRelModel,
              // }
            );
          } else if (phItem.sort) {
            // dead code 排序由单独的api来实现
            new Error("group:update->item:sort not implemented")
            // const phGrpItmRel = await PhGrpItmRelModel.findOne({
            //   where: {
            //     phGrpId: phItem.phGrpId,
            //     phItmId: phItem.id
            //   }
            // })
            // await phGrpItmRel.update({
            //   ordinal: phItem.ordinal
            // })
          } else if (phItem.bind) {
            const placeholderItem = await PlaceholderItemModel.findByPk(
              phItem.id
            );
            placeholderItem && await placeholderGroup?.addPlaceholderItems(
              [placeholderItem],
              // {
              // through: PhGrpItmRelModel,
              // }
            );
          } else {
            // dead code TODO 暂不允许修改（修改占位符有可能会影响到本次替换中其他模板已使用的占位符）
            // TODO 
            new Error("group:update->item:update not implemented")
            // const placeholderItem = await PlaceholderItemModel.findByPk(phItem.id)
            // await placeholderItem.update({
            //   name: phItem.name,
            //   type: phItem.type,
            //   format: phItem.format
            // })
          }
        }
      }
    }
  });
}

// export async function checkPlaceholderExistanceByName(items) {
//   return await beginTx(async (tx) => {
//     const result = [];
//     for (const item of items) {
//       const placeholderItem = await PlaceholderItemModel.findOne({
//         where: {
//           name: item.name,
//         },
//         include: {
//           model: PlaceholderGroupModel,
//           include: {
//             model: TemplateModel,
//             where: {
//               id: item.tplId
//             }
//           }
//         }
//       });
//       if (placeholderItem) {
//         result.push({
//           id: placeholderItem.id,
//           text: item.text,
//           type: placeholderItem.type,
//           format: placeholderItem.format,
//           status: placeholderItem.PlaceholderGroups.length == 0 ? 'saved' : 'bound'
//         });
//       }
//     }

//     return result;
//   });
// }

export async function checkPlaceholderExistanceByName(items: any[], tplId: string) {
  return await beginTx(async (tx) => {
    const placeholderItems = await PlaceholderItemModel.findAll({
      where: {
        name: {
          [Op.in]: items
        }
      },
      include: [{
        model: PlaceholderGroupModel,
        include: [{
          model: TemplateModel,
          where: {
            id: tplId
          }
        }]
      }]
    })
    return items.map(async item => {
      const matched = placeholderItems.find((placeholderItem: any) => placeholderItem.name == item)
      return matched ? {
        id: matched.id,
        name: matched.name,
        type: matched.type,
        format: matched.format,
        status: (await matched.getPlaceholderGroups()).length == 0 ? 'saved' : 'bound'
      } : {
        id: null,
        name: item,
        type: 'text',
        format: '',
        status: 'new'
      }
    })
  });
}

export async function savePlaceholderItem(item: any) {
  return await bulkSavePlaceholderItem([item]);
}

/**
 *
 * @param {[{ id: String?, name: String, type: String, format: String?, phGrpId: String, ordinal: Number }]} items
 * @returns
 */
export async function bulkSavePlaceholderItem(items: any[]) {
  return await beginTx(async (tx) => {
    for (const item of items) {
      if (item.delete) {
        const placeholderItem = await PlaceholderItemModel.findByPk(item.id, {
          // where: {
          //   id: item.id
          // },
          include: {
            model: PlaceholderGroupModel,
          },
        });

        if (!placeholderItem) continue

        // 若占位符关联多个分组，则 解除当前分组与占位符的关联
        if ((await placeholderItem.getPlaceholderGroups()).length > 1) {
          await PhGrpItmRelModel.destroy({
            where: {
              phGrpId: item.phGrpId,
              phItmId: item.id,
            },
          });
        } else {
          // 否则 删除此占位符（并解除与分组的关联）
          await placeholderItem.destroy() // TODO

          // await PlaceholderItemModel.destroy({
          //   where: {
          //     id: item.id,
          //   },
          //   include: {
          //     model: PlaceholderGroupModel,
          //     where: {
          //       id: item.phGrpId
          //     }
          //   }
          // });
        }
        // 重新排序当前分组下序号大于item.ordinal
        await PhGrpItmRelModel.update(
          {
            ordinal: sequelize.literal("ordinal - 1"),
          },
          {
            where: {
              phGrpId: item.phGrpId,
              ordinal: {
                [Op.gt]: item.ordinal,
              },
            },
          }
        );
      } else if (item.insert) {
        // 通过bulkSavePlaceholderGroup实现
        new Error("item:insert not implemented")
      } else if (item.sort) {
        new Error("item:sort not implemented")
      } else {
        // 通过bulkSavePlaceholderGroup实现
        new Error("item:update not implemented")
      }
    }
  });
}

// 新增分组： 模板关系（自动） <- 占位符分组 + 占位符(*1) -> 占位符关系（自动）
// 修改分组： 占位符分组 + 占位符(*1) -> 占位符关系（自动）
// 删除分组： 模板关系（自动） <- 占位符分组 + 占位符(*1) -> 占位符关系（自动）
// *1 新增占位符时，自动检测是否是已经存在的占位符，已存在则不新建占位符。
//    修改占位符时，自动检测该占位符是否已与其他占位符分组建立关系。
//        若占位符已被其他模板使用，则提示用户此次修改会影响其他模板是否继续
//            是：修改
//            否：取消修改 注：正确操作为修改模板文件中的占位符名称后覆盖当前模板文件（TODO 此操作会废除原有模板并断开与占位符分组的关系））
/**
 * 新增占位符分组（TODO 可以选择已经存在的占位符分组，是否根据模板中读取的占位符列表来筛选占位符分组？？）：
 *     1. 插入占位符分组表（optional）
 *     2. 插入模板占位符分组关系表
 *     3.
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// /**
//  * 保存模板
//  *
//  * @param {*} item
//  * @returns
//  */
// export async function saveTemplate(item) {
//   return await bulkSaveTemplate([item]);
// }

// /**
//  * 批量保存模板
//  *
//  * @param {[]} items
//  * @returns
//  */
// export async function bulkSaveTemplate(items) {
//   return await beginTx(async tx => {
//     for (const item of items) {
//       const businessCategory = await BusinessCategoryModel.findByPk(item.bcId);

//       if (item.delete) { // 删除
//         await TemplateModel.destroy({
//           where: {
//             id: item.id,
//           },
//         })
//       } else if (item.insert) { // 插入
//         await businessCategory.addTemplates(
//           await TemplateModel.create({ name: item.name, path: item.path }),
//           {
//             through: BcTplRelModel,
//           }
//         );
//       } else if (item.sort) { // 排序
//         const bcTplRel = await BcTplRelModel.findOne({
//           where: {
//             bcId: item.bcId,
//             tplId: item.id
//           }
//         })
//         await bcTplRel.update({
//           ordinal: item.ordinal
//         })
//       } else { // 更新
//         const template = await TemplateModel.findByPk(item.id)
//         await template.update({
//           name: item.name,
//           path: item.path
//         })
//       }
//     }
//   });
// }

// TODO 是否还需要？
export async function findOwnerlessTemplate() {
  return await sequelize.transaction((tx) => {
    // TODO sql需要更新表
    return sequelize.query(SQL.listOwnerlessTemplateSql, {
      type: QueryTypes.SELECT,
    });
  });
}