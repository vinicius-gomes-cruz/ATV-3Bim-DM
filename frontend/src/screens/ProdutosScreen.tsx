import { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { categoriaApi, produtoApi } from '../api/api';
import { Categoria, Produto } from '../types';
import { BotaoSair } from '../components/BotaoSair';

export function ProdutosScreen() {
  const navigation = useNavigation();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <BotaoSair /> });
  }, [navigation]);

  async function carregar() {
    const [produtosData, categoriasData] = await Promise.all([
      produtoApi.listar(),
      categoriaApi.listar(),
    ]);
    setProdutos(produtosData);
    setCategorias(categoriasData);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ListaProdutos produtos={produtos} />
      <FormularioProduto categorias={categorias} onProdutoCriado={carregar} />
    </ScrollView>
  );
}

function ListaProdutos({ produtos }: { produtos: Produto[] }) {
  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <View>
      <Text style={styles.titulo}>Produtos</Text>

      {produtos.length === 0 ? (
        <Text style={styles.mensagemVazia}>Nenhum produto cadastrado.</Text>
      ) : (
        <View style={styles.tabela}>
          <View style={[styles.linha, styles.cabecalho]}>
            <Text style={[styles.celula, styles.celulaCabecalho]}>ID</Text>
            <Text style={[styles.celula, styles.celulaCabecalho, { flex: 2 }]}>Nome</Text>
            <Text style={[styles.celula, styles.celulaCabecalho, { flex: 2 }]}>Categoria</Text>
            <Text style={[styles.celula, styles.celulaCabecalho]}>Preço</Text>
            <Text style={[styles.celula, styles.celulaCabecalho]}>Estoque</Text>
          </View>

          {produtos.map((produto) => (
            <View key={produto.id} style={styles.linha}>
              <Text style={styles.celula}>{produto.id}</Text>
              <Text style={[styles.celula, { flex: 2 }]}>{produto.nome}</Text>
              <Text style={[styles.celula, { flex: 2 }]}>{produto.categoria.nome}</Text>
              <Text style={styles.celula}>{formatarMoeda(produto.preco)}</Text>
              <Text style={styles.celula}>{produto.quantidade}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function FormularioProduto({
  categorias,
  onProdutoCriado,
}: {
  categorias: Categoria[];
  onProdutoCriado: () => void;
}) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [erro, setErro] = useState('');

  async function handleSubmit() {
    const nomeTratado = nome.trim();

    if (!nomeTratado || !preco.trim() || !quantidade.trim() || categoriaId === null) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    const precoNumero = Number(preco.replace(',', '.'));
    const quantidadeNumero = Number(quantidade);

    if (Number.isNaN(precoNumero) || precoNumero <= 0) {
      setErro('Informe um preço válido.');
      return;
    }

    if (!Number.isInteger(quantidadeNumero) || quantidadeNumero < 0) {
      setErro('Informe uma quantidade válida.');
      return;
    }

    setErro('');

    try {
      await produtoApi.criar({
        nome: nomeTratado,
        preco: precoNumero,
        quantidade: quantidadeNumero,
        categoriaId,
      });

      setNome('');
      setPreco('');
      setQuantidade('');
      setCategoriaId(null);
      onProdutoCriado();
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Não foi possível cadastrar o produto.');
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.subtitulo}>Novo Produto</Text>

      <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
      <TextInput
        style={styles.input}
        placeholder="Preço (ex.: 8,50)"
        value={preco}
        onChangeText={setPreco}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Quantidade inicial"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Categoria</Text>
      {categorias.length === 0 ? (
        <Text style={styles.mensagemVazia}>Cadastre uma categoria antes de criar produtos.</Text>
      ) : (
        <View style={styles.grupoOpcoes}>
          {categorias.map((categoria) => {
            const selecionada = categoriaId === categoria.id;
            return (
              <TouchableOpacity
                key={categoria.id}
                style={[styles.opcao, selecionada && styles.opcaoSelecionada]}
                onPress={() => setCategoriaId(categoria.id)}
              >
                <Text style={[styles.opcaoTexto, selecionada && styles.opcaoTextoSelecionada]}>
                  {categoria.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <TouchableOpacity style={styles.botao} onPress={handleSubmit}>
        <Text style={styles.botaoTexto}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  subtitulo: { fontWeight: '600', marginBottom: 8 },
  mensagemVazia: { color: '#666', marginBottom: 12 },
  tabela: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginBottom: 8 },
  linha: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', padding: 8 },
  cabecalho: { backgroundColor: '#f5f5f5' },
  celula: { flex: 1, fontSize: 12 },
  celulaCabecalho: { fontWeight: '600' },
  form: { marginTop: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8 },
  grupoOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  opcao: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  opcaoSelecionada: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  opcaoTexto: { color: '#333' },
  opcaoTextoSelecionada: { color: '#1d4ed8', fontWeight: '600' },
  erro: { color: 'red', marginBottom: 8 },
  botao: { backgroundColor: '#2563eb', padding: 10, borderRadius: 6 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
