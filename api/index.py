from flask import Flask, request, jsonify
from flask_cors import CORS
import requests as req
from bs4 import BeautifulSoup
from google.cloud import translate_v2 as translate
from google.oauth2 import service_account
import os
from history import History
app = Flask(__name__)
CORS(app)  # Habilite o CORS para todo o aplicativo

USERAGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
HEADERS = {"User-Agent": USERAGENT}
NOT_RESULT = "<h1 style='color:#ff0422;text-align:center'>Aucun résultat trouvé</h1>"

# Assumindo que você tenha a estrutura do seu histórico e métodos relevantes,
# você precisará ajustar isso conforme sua implementação de histórico.
history_data = {}  # Este é um substituto simplificado para o objeto History.

# Função para carregar credenciais da URL
def load_credentials():
    credentials_url = 'https://storage.googleapis.com/api-tradutor/chave-api.json'
    response = req.get(credentials_url)
    if response.status_code == 200:
        return service_account.Credentials.from_service_account_info(response.json())
    else:
        raise ValueError('Não foi possível carregar as credenciais')

# Use a função load_credentials() para obter as credenciais necessárias
credentials = load_credentials()
translate_client = translate.Client(credentials=credentials)


def get_definition(word):

    # Verifica se a palavra já está no histórico e, se sim, retorna a tradução armazenada
    if word in history_data:
        # Retorna a tradução e True indicando que veio do histórico
        return history_data[word], True

    try:
        URL = "https://www.larousse.fr/dictionnaires/francais/" + word.lower()
        response = req.get(URL, headers=HEADERS)
        soup = BeautifulSoup(response.text, "html.parser")
        div = soup.find("div", attrs={"id": "definition"})
        result = NOT_RESULT
        if div:
            result = str(div)
        else:
            content = soup.find("section", attrs={"class": "corrector"})
            if content:
                result = NOT_RESULT + str(content)

        history_data[word] = result  # Armazenando no histórico
        return result, False
    except req.exceptions.ConnectionError:
        return "A connection error occurred.", False
    except Exception as e:
        print(f"An error occurred: {e}")
        return "An error occurred while fetching the definition.", False


@app.route('/api/translate', methods=['POST'])
def translate_text():

    # Obtenha o texto da requisição
    data = request.json
    text = data.get('text', '')

    if not text:
        return jsonify({"error": "Texto para tradução não fornecido."}), 400

    # Realize a tradução para português brasileiro
    try:
        result = translate_client.translate(text, target_language='pt-BR')
        translated_text = result['translatedText']
        return jsonify({"translation": translated_text})
    except Exception as e:
        print(f"Erro ao traduzir texto: {e}")
        return jsonify({"error": "Erro ao traduzir texto."}), 500


@app.route('/api/definitions', methods=['GET'])
def definitions():
    word = request.args.get('word')
    if not word:
        return jsonify({"error": "Palavra não especificada."}), 400

    history_data = History.get_history_data()
    if word in history_data:
        return jsonify({"definition": history_data[word]}), 200

    # Se a palavra não estiver no histórico, prossiga para buscar a definição e armazenar no histórico
    definition, _ = get_definition(word)
    # Armazena a nova definição no histórico
    History.add_new_item(word, definition)
    return jsonify({"definition": definition})


@app.route('/api/history', methods=['GET'])
def history():
    try:
        history_data = History.get_history_data()
        return jsonify(history_data), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Não foi possível recuperar o histórico."}), 500


@app.route('/api/history/<word>', methods=['DELETE'])
def delete_history_item(word):
    try:
        success = History.delete_item(word)
        if success:
            return jsonify({"message": "Item deletado com sucesso."}), 200
        else:
            return jsonify({"error": "Item não encontrado no histórico."}), 404
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Não foi possível deletar o item do histórico."}), 500


@app.route('/api/history', methods=['DELETE'])
def clear_history():
    try:
        History.delete_all()
        return jsonify({"message": "Histórico limpo com sucesso."}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Não foi possível limpar o histórico."}), 500


if __name__ == '__main__':
    app.run(debug=True)
