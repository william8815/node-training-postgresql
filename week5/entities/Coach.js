const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'Coach',
  tableName: 'COACH',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    user_id: {
      type: 'uuid',
      unique: true,
      nullable: false
    },
    experience_years: {
      type: 'integer',
      nullable: false
    },
    description: {
      type: 'text',
      nullable: false
    },
    profile_image_url: {
      type: 'varchar',
      length: 2048,
      nullable: true
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
      nullable: false
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
      nullable: false
    }
  },
  // 關聯資料
  relations: {
    User: {
      target: 'User', // 關聯的 table
      type: 'one-to-one', // 類型（1對1、1對多、多對1）
      inverseSide: 'Coach',
      joinColumn: {
        name: 'user_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'coach_user_id_fk'
      }
    }
  }
})