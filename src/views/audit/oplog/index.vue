<template>
  <div class="app-container">

    <!-- 表格搜索 -->
    <el-form :inline="true">
      <el-form-item label="关键字：">
        <el-input v-model="queryParams.name" placeholder="支持用户名、IP地址、接口路径和UserAgent" size="small" prefix-icon="el-icon-search" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="searchList">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格头 -->
    <el-row :gutter="10">
      <el-col :span="1.5">
        <span style="color: #999; font-size: 12px;margin-left: 5px;vertical-align: bottom;">小提示：为确保敏感信息泄露，在请求参数和返回数据中所有敏感字段均已做删除处理。</span>
      </el-col>
    </el-row>

    <!-- 表格组件 -->
    <oplog-list-table
      v-loading="loading"
      :table-data="tableData"
    />

    <!-- 分页 -->
    <el-pagination
      background
      :current-page="queryParams.page"
      :page-sizes="[10, 15, 20, 30, 40]"
      :page-size="queryParams.limit"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
    />

  </div>
</template>

<script>
import { getOplogList } from '@/api/audit/log'
import OplogListTable from './table'

export default {
  components: {
    OplogListTable
  },
  data() {
    return {
      loading: true,
      tableData: [],
      total: 0,
      queryParams: {
        name: '',
        page: 1,
        limit: 15
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /* 查找数据 */
    searchList() {
      this.queryParams.page = 1
      this.loading = true
      this.getList()
    },

    /* 获取数据 */
    getList() {
      getOplogList(this.queryParams).then((res) => {
        this.tableData = res.data.items
        this.total = res.data.total
        this.loading = false
      })
    },

    /* page size变化 */
    handlePageSizeChange(newSize) {
      this.queryParams.limit = newSize
      this.getList()
    },

    /* page number的变化 */
    handlePageChange(newPage) {
      this.queryParams.page = newPage
      this.getList()
    }
  }
}
</script>
