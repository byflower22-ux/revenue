import { useState, useCallback } from 'react';
import {
  Card, Tabs, Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, Space, Typography, message,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, CopyOutlined,
} from '@ant-design/icons';
import { useDemo } from './DemoProvider';
import { pageMap, pageSections } from './iterations';

const { Title, Paragraph } = Typography;

const TYPE_COLORS = { new: 'green', modified: 'orange', optimized: 'purple' };
const TYPE_LABELS = { new: '新增', modified: '修改', optimized: '优化' };

export default function DemoAdminPage({ onNavigate }) {
  const {
    config, addVersion, editVersion, deleteVersion,
    addMark, editMark, deleteMark,
    addDoc, editDoc, deleteDoc,
    resetConfig,
  } = useDemo();

  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const [editingVersion, setEditingVersion] = useState(null);
  const [editingMark, setEditingMark] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);

  const [versionForm] = Form.useForm();
  const [markForm] = Form.useForm();
  const [docForm] = Form.useForm();

  const [markPageFilter, setMarkPageFilter] = useState(null);

  // Cascading section / field options for mark form
  const watchedPage = Form.useWatch('page', markForm);
  const watchedSection = Form.useWatch('section', markForm);

  const sectionOptions = (watchedPage && pageSections[watchedPage])
    ? pageSections[watchedPage].map(s => ({ value: s.key, label: s.key }))
    : [];

  const currentSectionDef = (watchedPage && watchedSection && pageSections[watchedPage])
    ? pageSections[watchedPage].find(s => s.key === watchedSection)
    : null;

  const fieldOptions = currentSectionDef?.fields?.length
    ? currentSectionDef.fields.map(f => ({ value: f, label: f }))
    : [];

  // ── Version CRUD ──
  const handleAddVersion = useCallback(() => {
    setEditingVersion(null);
    versionForm.resetFields();
    setVersionModalOpen(true);
  }, [versionForm]);

  const handleEditVersion = useCallback((record) => {
    setEditingVersion(record.key);
    versionForm.setFieldsValue(record);
    setVersionModalOpen(true);
  }, [versionForm]);

  const handleVersionSubmit = useCallback(async () => {
    try {
      const values = await versionForm.validateFields();
      if (editingVersion) {
        editVersion(editingVersion, values);
      } else {
        addVersion(values);
      }
      setVersionModalOpen(false);
      versionForm.resetFields();
    } catch {}
  }, [versionForm, editingVersion, addVersion, editVersion]);

  const handleDeleteVersion = useCallback((key) => {
    deleteVersion(key);
  }, [deleteVersion]);

  // ── Mark CRUD ──
  const handleAddMark = useCallback(() => {
    setEditingMark(null);
    markForm.resetFields();
    setMarkModalOpen(true);
  }, [markForm]);

  const handleEditMark = useCallback((key, markData) => {
    setEditingMark(key);
    markForm.setFieldsValue({ key, ...markData });
    setMarkModalOpen(true);
  }, [markForm]);

  const handleMarkSubmit = useCallback(async () => {
    try {
      const values = await markForm.validateFields();
      const { key, ...rest } = values;
      if (editingMark) {
        editMark(editingMark, rest);
      } else {
        addMark(key, rest);
      }
      setMarkModalOpen(false);
      markForm.resetFields();
    } catch {}
  }, [markForm, editingMark, addMark, editMark]);

  const handleDeleteMark = useCallback((key) => {
    deleteMark(key);
  }, [deleteMark]);

  // ── Doc CRUD ──
  const handleAddDoc = useCallback(() => {
    setEditingDoc(null);
    docForm.resetFields();
    setDocModalOpen(true);
  }, [docForm]);

  const handleEditDoc = useCallback((key, docData) => {
    setEditingDoc(key);
    docForm.setFieldsValue({ key, ...docData });
    setDocModalOpen(true);
  }, [docForm]);

  const handleDocSubmit = useCallback(async () => {
    try {
      const values = await docForm.validateFields();
      const { key, ...rest } = values;
      if (editingDoc) {
        editDoc(editingDoc, rest);
      } else {
        addDoc(key, rest);
      }
      setDocModalOpen(false);
      docForm.resetFields();
    } catch {}
  }, [docForm, editingDoc, addDoc, editDoc]);

  const handleDeleteDoc = useCallback((key) => {
    deleteDoc(key);
  }, [deleteDoc]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    resetConfig();
    message.success('已重置为默认配置');
  }, [resetConfig]);

  // ── Export ──
  const handleExport = useCallback(() => {
    const versions = config.versions.map(v => `    { key: '${v.key}', label: '${v.label}', date: '${v.date}' }`).join(',\n');
    const docsEntries = Object.keys(config.docs).map(k => {
      const d = config.docs[k];
      return `    '${k}': { title: '${d.title}', prd: ${d.prd ? `'${d.prd}'` : 'null'}, flow: ${d.flow ? `'${d.flow}'` : 'null'} }`;
    }).join(',\n');
    const marksEntries = Object.keys(config.marks).map(k => {
      const m = config.marks[k];
      const field = m.field ? `field: '${m.field}', ` : '';
      return `    '${k}': { page: '${m.page}', section: '${m.section}', ${field}version: '${m.version}', type: '${m.type}', label: '${m.label}', docKey: ${m.docKey ? `'${m.docKey}'` : 'null'} }`;
    }).join(',\n');

    const code = `export const iterations = {\n  versions: [\n${versions},\n  ],\n  docs: {\n${docsEntries},\n  },\n  marks: {\n${marksEntries},\n  },\n};\n`;
    navigator.clipboard.writeText(code).then(() => {
      message.success('代码已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  }, [config]);

  // ── Table data ──
  const versionDataSource = config.versions.map(v => ({ ...v }));
  const markDataSource = Object.entries(config.marks)
    .filter(([, m]) => !markPageFilter || m.page === markPageFilter)
    .map(([key, m]) => ({ key, ...m }));
  const docDataSource = Object.entries(config.docs).map(([key, d]) => ({ key, ...d }));

  // ── Version table columns ──
  const versionColumns = [
    { title: 'key', dataIndex: 'key', key: 'key', width: 100 },
    { title: '名称', dataIndex: 'label', key: 'label' },
    { title: '日期', dataIndex: 'date', key: 'date', width: 100 },
    {
      title: '操作', key: 'action', width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditVersion(record)}>编辑</Button>
          <Popconfirm title="确认删除该版本？" onConfirm={() => handleDeleteVersion(record.key)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Mark table columns ──
  const markColumns = [
    { title: 'key', dataIndex: 'key', key: 'key', width: 160 },
    {
      title: '所属页面', dataIndex: 'page', key: 'page', width: 120,
      render: (page) => page ? <Tag color="blue">{pageMap[page] || page}</Tag> : '-',
    },
    { title: '区域', dataIndex: 'section', key: 'section', width: 130 },
    {
      title: '字段', dataIndex: 'field', key: 'field', width: 100,
      render: (val) => val ? <Tag color="geekblue">{val}</Tag> : <span style={{ color: '#bbb' }}>整个区域</span>,
    },
    {
      title: '版本', dataIndex: 'version', key: 'version', width: 110,
      render: (ver) => {
        const found = config.versions.find(v => v.key === ver);
        return <Tag>{found ? found.label : ver}</Tag>;
      },
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 80,
      render: (type) => <Tag color={TYPE_COLORS[type]}>{TYPE_LABELS[type] || type}</Tag>,
    },
    { title: '标签', dataIndex: 'label', key: 'label' },
    {
      title: '关联文档', dataIndex: 'docKey', key: 'docKey', width: 180,
      render: (docKey) => {
        if (!docKey) return '-';
        const doc = config.docs[docKey];
        return doc ? doc.title : docKey;
      },
    },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space>
          {record.page && onNavigate && (
            <Button type="link" size="small" onClick={() => onNavigate(record.page)}>查看</Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditMark(record.key, record)}>编辑</Button>
          <Popconfirm title="确认删除该标记？" onConfirm={() => handleDeleteMark(record.key)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Doc table columns ──
  const docColumns = [
    { title: 'key', dataIndex: 'key', key: 'key', width: 220 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: 'PRD路径', dataIndex: 'prd', key: 'prd', width: 260, render: (val) => val || '-' },
    { title: '流程图路径', dataIndex: 'flow', key: 'flow', width: 260, render: (val) => val || '-' },
    {
      title: '操作', key: 'action', width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDoc(record.key, record)}>编辑</Button>
          <Popconfirm title="确认删除该文档？" onConfirm={() => handleDeleteDoc(record.key)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'versions', label: '版本管理',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddVersion}>新增版本</Button>
          </div>
          <Table size="small" dataSource={versionDataSource} columns={versionColumns} rowKey="key" pagination={false} bordered />
        </>
      ),
    },
    {
      key: 'marks', label: '标记点管理',
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMark}>新增标记</Button>
            <Select
              placeholder="按页面筛选" allowClear style={{ width: 180 }}
              value={markPageFilter} onChange={setMarkPageFilter}
              options={Object.entries(pageMap).map(([k, v]) => ({ value: k, label: v }))}
            />
          </div>
          <Table size="small" dataSource={markDataSource} columns={markColumns} rowKey="key" pagination={false} bordered />
        </>
      ),
    },
    {
      key: 'docs', label: '文档管理',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDoc}>新增文档</Button>
          </div>
          <Table size="small" dataSource={docDataSource} columns={docColumns} rowKey="key" pagination={false} bordered />
        </>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>演示配置管理</Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
            管理迭代版本、标记点和文档关联
          </Paragraph>
        </div>

        <Tabs items={tabItems} />

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Popconfirm title="确认重置？" description="将清除所有自定义配置并恢复为默认值" onConfirm={handleReset} okText="重置" cancelText="取消">
            <Button icon={<UndoOutlined />}>重置为默认配置</Button>
          </Popconfirm>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleExport}>导出为代码</Button>
        </div>
      </Card>

      {/* ── Version Modal ── */}
      <Modal
        title={editingVersion ? '编辑版本' : '新增版本'}
        open={versionModalOpen} onOk={handleVersionSubmit} onCancel={() => setVersionModalOpen(false)}
        okText="确定" cancelText="取消" destroyOnClose
      >
        <Form form={versionForm} layout="vertical" autoComplete="off">
          <Form.Item name="key" label="版本 Key" rules={[{ required: true, message: '请输入版本 Key' }]}>
            <Input placeholder="例如 2.6" disabled={!!editingVersion} />
          </Form.Item>
          <Form.Item name="label" label="版本名称" rules={[{ required: true, message: '请输入版本名称' }]}>
            <Input placeholder="例如 2.6迭代" />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请输入日期' }]}>
            <Input placeholder="例如 04-26" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Mark Modal ── */}
      <Modal
        title={editingMark ? '编辑标记' : '新增标记'}
        open={markModalOpen} onOk={handleMarkSubmit} onCancel={() => setMarkModalOpen(false)}
        okText="确定" cancelText="取消" destroyOnClose
      >
        <Form form={markForm} layout="vertical" autoComplete="off"
          onValuesChange={(changed) => {
            if (changed.page) {
              markForm.setFieldsValue({ section: undefined, field: undefined });
            }
            if (changed.section) {
              markForm.setFieldsValue({ field: undefined });
            }
          }}
        >
          <Form.Item name="key" label="标记 Key" rules={[{ required: true, message: '请输入标记 Key' }]}>
            <Input placeholder="例如 new-feature-mark" disabled={!!editingMark} />
          </Form.Item>
          <Form.Item name="page" label="所属页面" rules={[{ required: true, message: '请选择页面' }]}>
            <Select
              placeholder="选择所属页面"
              options={Object.entries(pageMap).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Form.Item>
          <Form.Item name="section" label="区域" rules={[{ required: true, message: '请选择区域' }]}>
            <Select
              placeholder="选择区域"
              options={sectionOptions}
            />
          </Form.Item>
          <Form.Item name="field" label="字段（可选）">
            <Select
              placeholder={fieldOptions.length ? '选择具体字段，留空则标记整个区域' : '该区域无细分字段'}
              options={fieldOptions}
              allowClear
              disabled={!fieldOptions.length}
            />
          </Form.Item>
          <Form.Item name="version" label="版本" rules={[{ required: true, message: '请选择版本' }]}>
            <Select
              placeholder="选择版本"
              options={config.versions.map(v => ({ value: v.key, label: v.label }))}
            />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              placeholder="选择类型"
              options={[
                { value: 'new', label: '新增' },
                { value: 'modified', label: '修改' },
                { value: 'optimized', label: '优化' },
              ]}
            />
          </Form.Item>
          <Form.Item name="label" label="标签" rules={[{ required: true, message: '请输入标签' }]}>
            <Input placeholder="例如 某功能模块" />
          </Form.Item>
          <Form.Item name="docKey" label="关联文档">
            <Select
              placeholder="选择关联文档"
              allowClear
              options={Object.keys(config.docs).map(k => ({ value: k, label: config.docs[k].title }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Doc Modal ── */}
      <Modal
        title={editingDoc ? '编辑文档' : '新增文档'}
        open={docModalOpen} onOk={handleDocSubmit} onCancel={() => setDocModalOpen(false)}
        okText="确定" cancelText="取消" destroyOnClose
      >
        <Form form={docForm} layout="vertical" autoComplete="off">
          <Form.Item name="key" label="文档 Key" rules={[{ required: true, message: '请输入文档 Key' }]}>
            <Input placeholder="例如 feature-prd" disabled={!!editingDoc} />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例如 某功能 PRD" />
          </Form.Item>
          <Form.Item name="prd" label="PRD 路径">
            <Input placeholder="例如 需求文档/xxx-prd（留空则为 null）" />
          </Form.Item>
          <Form.Item name="flow" label="流程图路径">
            <Input placeholder="例如 流程图/xxx-flow（留空则为 null）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
