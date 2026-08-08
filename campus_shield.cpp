/*
 * CampusShield - C++ Core Engine & Complete HTTP Web Server
 * Modern Women's Safety & Community Monitoring System for Universities
 * 
 * Serves both REST API and Static Web App (index.html, styles.css, app.js)
 * Accessible across local Wi-Fi network!
 */

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <cmath>
#include <algorithm>
#include <sstream>
#include <fstream>
#include <ctime>
#include <iomanip>
#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

using namespace std;

// Data Structure definitions
struct Location {
    double lat;
    double lng;
    string name;
};

struct Incident {
    int id;
    string category;
    string description;
    string date;
    string time;
    Location location;
    bool anonymous;
    string status; // "Pending", "Investigating", "Resolved"
    int priorityLevel; // 1 (Low) - 5 (Critical)
    double riskScore;  // Calculated by C++ AI
    bool isSpam;       // Calculated by C++ AI
    string summary;    // AI Generated summary
    int upvotes;
    int confirmations;
};

struct CampusNode {
    int id;
    string name;
    double lat;
    double lng;
    int lightingQuality;
    bool hasSecurityCamera;
    bool hasGuardPost;
};

// Global Memory State for C++ Engine
vector<Incident> g_incidents;
vector<CampusNode> g_nodes;

// Helper function to read file content
string readFileContent(const string& filepath) {
    ifstream file(filepath, ios::binary);
    if (!file.is_open()) return "";
    ostringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

// Initialize Default Campus Map Graph & Sample Data
void initCampusData() {
    g_nodes = {
        {1, "Main Gate Security", 28.5450, 77.1920, 10, true, true},
        {2, "Central Library", 28.5462, 77.1935, 9, true, true},
        {3, "Girls Hostel Block A", 28.5480, 77.1915, 10, true, true},
        {4, "Science Block Quad", 28.5455, 77.1950, 6, true, false},
        {5, "Sports Ground Pathway", 28.5490, 77.1940, 3, false, false},
        {6, "Old Cafeteria Alley", 28.5440, 77.1960, 4, false, false},
        {7, "North Car Parking", 28.5470, 77.1970, 5, true, false},
        {8, "Auditorium Complex", 28.5435, 77.1930, 8, true, true}
    };

    g_incidents.push_back({
        101, "Poor Lighting", "Dark path behind sports ground with broken streetlight.",
        "2026-08-05", "21:30", {28.5490, 77.1940, "Sports Ground Pathway"},
        true, "Investigating", 3, 68.5, false,
        "Dark pathway requires urgent streetlight maintenance.", 14, 5
    });

    g_incidents.push_back({
        102, "Stalking / Following", "Suspicious individual following student near cafeteria alley.",
        "2026-08-06", "22:15", {28.5440, 77.1960, "Old Cafeteria Alley"},
        false, "Pending", 5, 89.2, false,
        "High-priority stalking incident reported near cafeteria alley.", 28, 12
    });

    g_incidents.push_back({
        103, "Suspicious Activity", "Group loitering near hostel gate past curfew hours.",
        "2026-08-07", "23:00", {28.5480, 77.1915, "Girls Hostel Block A"},
        true, "Investigating", 4, 75.0, false,
        "Loitering activity near hostel perimeter under review by security.", 19, 8
    });
}

// C++ AI Risk Prediction Engine Algorithm
double calculateLocationRisk(double lat, double lng) {
    double totalRisk = 20.0;
    for (const auto& inc : g_incidents) {
        double dLat = (inc.location.lat - lat) * 111000.0;
        double dLng = (inc.location.lng - lng) * 111000.0;
        double distMeters = sqrt(dLat * dLat + dLng * dLng);

        if (distMeters < 500.0) {
            double distanceFactor = 1.0 - (distMeters / 500.0);
            double severityMultiplier = inc.priorityLevel * 10.0;
            if (inc.status != "Resolved") {
                totalRisk += severityMultiplier * distanceFactor;
            } else {
                totalRisk += (severityMultiplier * 0.3) * distanceFactor;
            }
        }
    }
    return min(98.5, max(10.0, totalRisk));
}

// JSON Serialization Helpers
string incidentToJson(const Incident& inc) {
    ostringstream oss;
    oss << "{"
        << "\"id\":" << inc.id << ","
        << "\"category\":\"" << inc.category << "\","
        << "\"description\":\"" << inc.description << "\","
        << "\"date\":\"" << inc.date << "\","
        << "\"time\":\"" << inc.time << "\","
        << "\"location\":{\"lat\":" << inc.location.lat << ",\"lng\":" << inc.location.lng << ",\"name\":\"" << inc.location.name << "\"},"
        << "\"anonymous\":" << (inc.anonymous ? "true" : "false") << ","
        << "\"status\":\"" << inc.status << "\","
        << "\"priorityLevel\":" << inc.priorityLevel << ","
        << "\"riskScore\":" << fixed << setprecision(1) << inc.riskScore << ","
        << "\"isSpam\":" << (inc.isSpam ? "true" : "false") << ","
        << "\"summary\":\"" << inc.summary << "\","
        << "\"upvotes\":" << inc.upvotes << ","
        << "\"confirmations\":" << inc.confirmations
        << "}";
    return oss.str();
}

string getAllIncidentsJson() {
    ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < g_incidents.size(); ++i) {
        oss << incidentToJson(g_incidents[i]);
        if (i + 1 < g_incidents.size()) oss << ",";
    }
    oss << "]";
    return oss.str();
}

string getRiskMapJson() {
    ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < g_nodes.size(); ++i) {
        double risk = calculateLocationRisk(g_nodes[i].lat, g_nodes[i].lng);
        string riskLevel = "Green";
        if (risk > 70.0) riskLevel = "Red";
        else if (risk > 45.0) riskLevel = "Yellow";

        oss << "{"
            << "\"id\":" << g_nodes[i].id << ","
            << "\"name\":\"" << g_nodes[i].name << "\","
            << "\"lat\":" << g_nodes[i].lat << ","
            << "\"lng\":" << g_nodes[i].lng << ","
            << "\"riskScore\":" << fixed << setprecision(1) << risk << ","
            << "\"riskLevel\":\"" << riskLevel << "\","
            << "\"lightingQuality\":" << g_nodes[i].lightingQuality << ","
            << "\"hasCamera\":" << (g_nodes[i].hasSecurityCamera ? "true" : "false") << ","
            << "\"hasGuardPost\":" << (g_nodes[i].hasGuardPost ? "true" : "false")
            << "}";
        if (i + 1 < g_nodes.size()) oss << ",";
    }
    oss << "]";
    return oss.str();
}

// HTTP Response Builder
string buildHttpResponse(const string& body, const string& contentType = "application/json", int statusCode = 200) {
    ostringstream oss;
    oss << "HTTP/1.1 " << statusCode << " OK\r\n"
        << "Access-Control-Allow-Origin: *\r\n"
        << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        << "Access-Control-Allow-Headers: Content-Type\r\n"
        << "Content-Type: " << contentType << "\r\n"
        << "Content-Length: " << body.length() << "\r\n"
        << "Connection: close\r\n\r\n"
        << body;
    return oss.str();
}

// HTTP Web Server handling API + Static Web Files
void runServer(int port) {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) return;

    SOCKET listenSock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listenSock == INVALID_SOCKET) { WSACleanup(); return; }

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(port);

    if (bind(listenSock, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        closesocket(listenSock);
        WSACleanup();
        return;
    }

    if (listen(listenSock, SOMAXCONN) == SOCKET_ERROR) {
        closesocket(listenSock);
        WSACleanup();
        return;
    }

    cout << "==========================================================" << endl;
    cout << "  CampusShield Web & API C++ Server Running on Port " << port << endl;
    cout << "  Local Link:   http://localhost:" << port << endl;
    cout << "  Network Link: http://10.74.23.16:" << port << endl;
    cout << "==========================================================" << endl;

    while (true) {
        SOCKET clientSock = accept(listenSock, NULL, NULL);
        if (clientSock == INVALID_SOCKET) continue;

        char buffer[8192] = {0};
        int bytesRead = recv(clientSock, buffer, sizeof(buffer) - 1, 0);
        if (bytesRead > 0) {
            string request(buffer);
            string response;

            if (request.find("OPTIONS") == 0) {
                response = buildHttpResponse("", "text/plain", 204);
            }
            // API Endpoints
            else if (request.find("GET /api/health") != string::npos) {
                string body = "{\"status\":\"online\",\"engine\":\"CampusShield C++ Web Server\",\"version\":\"v2.0\",\"totalIncidents\":" + to_string(g_incidents.size()) + "}";
                response = buildHttpResponse(body);
            }
            else if (request.find("GET /api/incidents") != string::npos) {
                response = buildHttpResponse(getAllIncidentsJson());
            }
            else if (request.find("GET /api/risk-map") != string::npos) {
                response = buildHttpResponse(getRiskMapJson());
            }
            // Static Files Web Server
            else if (request.find("GET /styles.css") != string::npos) {
                string css = readFileContent("styles.css");
                response = buildHttpResponse(css, "text/css");
            }
            else if (request.find("GET /app.js") != string::npos) {
                string js = readFileContent("app.js");
                response = buildHttpResponse(js, "application/javascript");
            }
            else {
                // Default: index.html
                string html = readFileContent("index.html");
                if (html.empty()) html = "<h1>CampusShield C++ Server Active</h1>";
                response = buildHttpResponse(html, "text/html");
            }

            send(clientSock, response.c_str(), (int)response.length(), 0);
        }
        closesocket(clientSock);
    }

    closesocket(listenSock);
    WSACleanup();
}

int main(int argc, char* argv[]) {
    initCampusData();
    runServer(8080);
    return 0;
}
